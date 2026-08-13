// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {IKritherPaymaster} from "../interfaces/IKritherPaymaster.sol";
import {KritherSubscriptions} from "../abstracts/KritherSubscriptions.sol";
import {Constants} from "../libraries/Constants.sol";
import {
    IEntryPoint
} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {
    IPaymaster
} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import {
    PackedUserOperation
} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract KritherPaymaster is
    KritherSubscriptions,
    IKritherPaymaster,
    IPaymaster
{
    /// @dev Sponsorship is its own job: the gas budget, the stake and the
    ///      revenue are handled by whoever holds this, not by the registry
    ///      admin that accredits producers and opens plans.
    bytes32 public constant PAYMASTER_ROLE = Constants.PAYMASTER_ROLE;

    IEntryPoint public immutable entryPoint;

    uint256 public maxCostPerOp;

    mapping(address => bool) public sponsoredTargets;

    mapping(address => uint256) public freeOps;

    constructor(
        address registry_,
        address entryPoint_
    ) KritherSubscriptions(registry_) checkAddressZero(entryPoint_) {
        entryPoint = IEntryPoint(entryPoint_);
        sponsoredTargets[registry_] = true;
        sponsoredTargets[address(this)] = true;
    }

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), NotEntryPoint());
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            USER OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /// @dev Reads the targets out of the call an account is about to make and
    ///      reports whether the operation is an account buying its first plan,
    ///      naming which one.
    /// @dev A `subscribe(uint8)` call is 36 bytes, its argument padded into the
    ///      last word, so anything else is read as an ordinary sponsored call.
    function _readTargets(
        bytes calldata callData
    ) private view returns (bool onboarding, uint8 planId) {
        require(callData.length >= 4, CallShapeUnsupported());
        bytes4 selector = bytes4(callData[:4]);

        if (selector == Constants.EXECUTE_SELECTOR) {
            (address target, , bytes memory data) = abi.decode(
                callData[4:],
                (address, uint256, bytes)
            );
            require(sponsoredTargets[target], TargetNotAllowed());

            onboarding =
                target == address(this) &&
                data.length == Constants.SUBSCRIBE_CALL_LENGTH &&
                bytes4(data) == Constants.SUBSCRIBE_SELECTOR;
            planId = onboarding
                ? uint8(data[Constants.SUBSCRIBE_CALL_LENGTH - 1])
                : 0;
            return (onboarding, planId);
        }

        if (selector == Constants.EXECUTE_BATCH_SELECTOR) {
            AccountCall[] memory calls = abi.decode(
                callData[4:],
                (AccountCall[])
            );
            for (uint256 i = 0; i < calls.length; ++i) {
                require(sponsoredTargets[calls[i].target], TargetNotAllowed());
            }
            return (false, 0);
        }

        revert CallShapeUnsupported();
    }

    /// @inheritdoc IPaymaster
    /// @dev Tightened to `view`, which ERC-4337 allows and bundlers want:
    ///      they drop a paymaster whose validation writes unless it is
    ///      whitelisted. Every allowance this contract keeps is settled in
    ///      `postOp`, so the compiler now holds that line.
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32,
        uint256 maxCost
    )
        external
        view
        whenNotPaused
        onlyEntryPoint
        returns (bytes memory context, uint256 validationData)
    {
        require(maxCost <= maxCostPerOp, CostTooHigh());

        (bool onboarding, uint8 planId) = _readTargets(userOp.callData);
        Subscription storage subscription = _subscriptions[userOp.sender];
        bool lapsed = subscription.expiresAt <= block.timestamp;

        /// @dev Free operations are what an accredited actor rides in on and
        ///      renews on, so they are gated on the accreditation the plan
        ///      sells against. Ungated, anyone could mint accounts and spend
        ///      the gas budget one free operation at a time.
        if (
            onboarding &&
            lapsed &&
            freeOps[userOp.sender] < Constants.MAX_FREE_OPS
        ) {
            _requirePlanExists(planId);
            _requireAccredited(_plans[planId].role, userOp.sender);
            return (abi.encode(userOp.sender, true), 0);
        }

        require(!lapsed, SubscriptionExpired());
        _requireAccredited(_plans[subscription.planId].role, userOp.sender);

        uint32 used = subscription.periodEnd > block.timestamp
            ? subscription.used
            : 0;
        require(used < subscription.quota, QuotaExhausted());

        context = abi.encode(userOp.sender, false);
        validationData =
            uint256(subscription.expiresAt) <<
            Constants.VALID_UNTIL_SHIFT;
    }

    /// @inheritdoc IPaymaster
    /// @dev Never gated on the pause: an operation the paymaster already
    ///      agreed to pay for must settle, and a reverting `postOp` would
    ///      only cost it the gas twice.
    function postOp(
        PostOpMode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256
    ) external onlyEntryPoint {
        (address account, bool onboarding) = abi.decode(
            context,
            (address, bool)
        );

        Subscription storage subscription = _subscriptions[account];

        /// @dev The plan is bought by the very call this settles, so a running
        ///      subscription means the operation turned into revenue and costs
        ///      the account none of its free ones. Anything else bought
        ///      nothing and is charged against them.
        if (onboarding) {
            if (subscription.expiresAt > block.timestamp) {
                freeOps[account] = 0;
                emit OnboardingSponsored(account, actualGasCost);
            } else {
                /// @dev Stopping at the cap for the reason quota stops at its
                ///      own, one branch below: a bundle can validate two
                ///      operations from one account against the same count,
                ///      and counting past it would underflow what is left.
                if (freeOps[account] < Constants.MAX_FREE_OPS) {
                    freeOps[account] += 1;
                }
                uint256 remainingFreeOps = Constants.MAX_FREE_OPS -
                    freeOps[account];
                emit OnboardingFailed(account, actualGasCost, remainingFreeOps);
            }
            return;
        }

        if (subscription.periodEnd > block.timestamp) {
            /// @dev A bundle may carry two operations from one account, both
            ///      validated against the same allowance before either
            ///      settles. Stopping at the quota costs the paymaster the
            ///      overrun, where counting past it would underflow every
            ///      later read.
            if (subscription.used < subscription.quota) {
                subscription.used += 1;
            }
        } else {
            /// @dev A window belongs to the subscription paying for it, so it
            ///      never outlives one. Left unclamped it can, and an account
            ///      renewing inside the overhang carries in the quota a
            ///      subscription it has already replaced had spent.
            subscription.used = 1;
            uint64 periodEnd = uint64(block.timestamp + subscription.period);
            subscription.periodEnd = periodEnd > subscription.expiresAt
                ? subscription.expiresAt
                : periodEnd;
        }

        emit OperationSponsored(
            account,
            actualGasCost,
            subscription.quota - subscription.used
        );
    }

    /*//////////////////////////////////////////////////////////////
                            FREE OPERATIONS
    //////////////////////////////////////////////////////////////*/

    function resetFreeOps(
        address account
    )
        external
        whenNotPaused
        onlyRegistryRole(PAYMASTER_ROLE)
        checkAddressZero(account)
    {
        freeOps[account] = 0;
        emit FreeOpsReset(account);
    }

    /*//////////////////////////////////////////////////////////////
                           SPONSORSHIP TERMS
    //////////////////////////////////////////////////////////////*/

    function setMaxCostPerOp(
        uint256 newMaxCostPerOp
    ) external whenNotPaused onlyRegistryRole(PAYMASTER_ROLE) {
        maxCostPerOp = newMaxCostPerOp;
        emit MaxCostPerOpSet(newMaxCostPerOp);
    }

    function setSponsoredTarget(
        address target,
        bool allowed
    )
        external
        whenNotPaused
        onlyRegistryRole(PAYMASTER_ROLE)
        checkAddressZero(target)
    {
        sponsoredTargets[target] = allowed;
        emit SponsoredTargetSet(target, allowed);
    }

    /*//////////////////////////////////////////////////////////////
                               GAS BUDGET
    //////////////////////////////////////////////////////////////*/

    function entryPointBalance() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function depositToEntryPoint(
        uint256 amount
    ) external whenNotPaused onlyRegistryRole(PAYMASTER_ROLE) {
        entryPoint.depositTo{value: amount}(address(this));
    }

    function addStake(
        uint32 unstakeDelaySec
    ) external payable whenNotPaused onlyRegistryRole(PAYMASTER_ROLE) {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    function unlockStake()
        external
        whenNotPaused
        onlyRegistryRole(PAYMASTER_ROLE)
    {
        entryPoint.unlockStake();
    }

    /*//////////////////////////////////////////////////////////////
                                WITHDRAWALS
    //////////////////////////////////////////////////////////////*/

    /// @dev Money leaving Krither answers to the registry admin, never to the
    ///      role that merely runs the sponsorship day to day.
    function withdrawFromEntryPoint(
        address payable to,
        uint256 amount
    )
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(to)
    {
        entryPoint.withdrawTo(to, amount);
    }

    function withdrawStake(
        address payable to
    )
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(to)
    {
        entryPoint.withdrawStake(to);
    }

    function withdrawRevenue(
        address payable to,
        uint256 amount
    )
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(to)
    {
        emit RevenueWithdrawn(to, amount);
        (bool sent, ) = to.call{value: amount}("");
        require(sent, WithdrawFailed());
    }
}
