// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {IKritherPaymaster} from "../interfaces/IKritherPaymaster.sol";
import {KritherSubscriptions} from "../abstracts/KritherSubscriptions.sol";
import {IKritherSubscriptions} from "../interfaces/IKritherSubscriptions.sol";
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

/// @notice ERC-4337 paymaster: pays the gas of accredited Krither accounts,
///         out of a subscription's quota or a capped onboarding allowance.
contract KritherPaymaster is
    KritherSubscriptions,
    IKritherPaymaster,
    IPaymaster
{
    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @dev Sponsorship is its own job: the gas budget, the stake and the
    ///      revenue are handled by whoever holds this
    bytes32 public constant PAYMASTER_ROLE = Constants.PAYMASTER_ROLE;

    bytes32 public constant DEFAULT_ADMIN_ROLE = Constants.DEFAULT_ADMIN_ROLE;
    bytes32 public constant PAUSER_ROLE = Constants.PAUSER_ROLE;

    IEntryPoint public immutable entryPoint;

    uint256 public maxCostPerOp;

    mapping(address target => bool allowed) public sponsoredTargets;

    mapping(address account => uint256 used) public freeOps;

    /// @param registry_ Registry every accreditation is read from.
    /// @param entryPoint_ EntryPoint the paymaster answers to.
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

    /// @notice Restricts a call to the EntryPoint.
    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), NotEntryPoint());
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            USER OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Reads the targets out of the call an account is about to make.
    /// @dev A `subscribe(uint8)` call is 36 bytes, its argument padded into the
    ///      last word; anything else is an ordinary sponsored call.
    /// @param callData Call the account forwards.
    /// @return subscribing Whether the operation buys a plan.
    /// @return planId Plan it buys, zero otherwise.
    function _readTargets(
        bytes calldata callData
    ) private view returns (bool subscribing, uint8 planId) {
        require(callData.length >= 4, CallShapeUnsupported());
        bytes4 selector = bytes4(callData[:4]);

        if (selector == Constants.EXECUTE_SELECTOR) {
            (address target, , bytes memory data) = abi.decode(
                callData[4:],
                (address, uint256, bytes)
            );
            require(sponsoredTargets[target], TargetNotAllowed());

            subscribing =
                target == address(this) &&
                data.length == Constants.SUBSCRIBE_CALL_LENGTH &&
                bytes4(data) == Constants.SUBSCRIBE_SELECTOR;
            planId = subscribing
                ? uint8(data[Constants.SUBSCRIBE_CALL_LENGTH - 1])
                : 0;
            return (subscribing, planId);
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

    /// @notice Reads which lane an operation asks to be paid out of.
    /// @dev Taken on trust: the lane only picks which terms the operation is
    ///      held to, and each set carries the window it is true in.
    /// @param paymasterAndData Paymaster field of the operation.
    /// @return onboarding Whether it asks for the onboarding lane.
    function _readLane(
        bytes calldata paymasterAndData
    ) private pure returns (bool onboarding) {
        return
            paymasterAndData.length > Constants.PAYMASTER_DATA_OFFSET &&
            paymasterAndData[Constants.PAYMASTER_DATA_OFFSET] ==
            Constants.ONBOARDING_LANE;
    }

    /// @inheritdoc IPaymaster
    /// @dev `view` on purpose: bundlers drop a paymaster whose validation
    ///      writes, so every allowance is settled in `postOp` instead.
    /// @dev No branch reads the clock, a banned opcode here; a time condition
    ///      is handed to the EntryPoint as the window the operation holds in.
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

        (bool subscribing, uint8 planId) = _readTargets(userOp.callData);
        Subscription storage subscription = _subscriptions[userOp.sender];

        // Gated on the accreditation the plan sells against: ungated, anyone
        // could mint accounts and drain the budget one free operation at a
        // time. Opening at `expiresAt` keeps a running subscription out.
        if (
            subscribing &&
            _readLane(userOp.paymasterAndData) &&
            freeOps[userOp.sender] < Constants.MAX_FREE_OPS
        ) {
            _requirePlanExists(planId);
            _requireAccredited(_plans[planId].role, userOp.sender);
            return (
                abi.encode(userOp.sender, true),
                uint256(subscription.expiresAt) << Constants.VALID_AFTER_SHIFT
            );
        }

        require(subscription.expiresAt != 0, SubscriptionExpired());
        _requireAccredited(_plans[subscription.planId].role, userOp.sender);

        // A spent quota refills at `periodEnd`, so the operation waits rather
        // than being refused; past the last window there is nothing to refill.
        bool exhausted = subscription.used >= subscription.quota;
        require(
            !exhausted || subscription.periodEnd < subscription.expiresAt,
            QuotaExhausted()
        );

        context = abi.encode(userOp.sender, false);
        validationData =
            uint256(subscription.expiresAt) <<
            Constants.VALID_UNTIL_SHIFT;
        if (exhausted) {
            validationData |=
                uint256(subscription.periodEnd) <<
                Constants.VALID_AFTER_SHIFT;
        }
    }

    /// @inheritdoc IPaymaster
    /// @dev Never gated on the pause: an operation already agreed to must
    ///      settle, and a reverting `postOp` costs the gas twice.
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

        // The plan is bought by the very call this settles: a running
        // subscription means the operation turned into revenue.
        if (onboarding) {
            if (subscription.expiresAt > block.timestamp) {
                freeOps[account] = 0;
                emit OnboardingSponsored(account, actualGasCost);
            } else {
                // A bundle can validate two operations against the same
                // count; counting past the cap would underflow what is left.
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
            // Two operations may validate against the same allowance before
            // either settles; stopping at the quota costs the overrun, where
            // counting past it would underflow every later read.
            if (subscription.used < subscription.quota) {
                subscription.used += 1;
            }
        } else {
            // A window never outlives the subscription paying for it: left
            // unclamped, a renewal inside the overhang would carry in a quota
            // the replaced subscription had already spent.
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

    /// @inheritdoc IKritherPaymaster
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

    /// @inheritdoc IKritherPaymaster
    function setMaxCostPerOp(
        uint256 newMaxCostPerOp
    ) external whenNotPaused onlyRegistryRole(PAYMASTER_ROLE) {
        maxCostPerOp = newMaxCostPerOp;
        emit MaxCostPerOpSet(newMaxCostPerOp);
    }

    /// @inheritdoc IKritherPaymaster
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

    /// @inheritdoc IKritherPaymaster
    function entryPointBalance() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    /// @inheritdoc IKritherPaymaster
    /// @dev `amount` is what reaches the EntryPoint, `msg.value` what the
    ///      caller advances first: a paymaster with no subscribers yet holds
    ///      no revenue to move.
    function depositToEntryPoint(
        uint256 amount
    ) external payable whenNotPaused onlyRegistryRole(PAYMASTER_ROLE) {
        emit FundsDeposited(
            "deposit",
            msg.sender,
            msg.value,
            amount > msg.value ? amount - msg.value : 0
        );
        entryPoint.depositTo{value: amount}(address(this));
    }

    /// @inheritdoc IKritherPaymaster
    /// @dev Nothing held can go in: the EntryPoint stakes what the call
    ///      carries and the contract cannot add to it.
    function addStake(
        uint32 unstakeDelaySec
    ) external payable whenNotPaused onlyRegistryRole(PAYMASTER_ROLE) {
        emit FundsDeposited("stake", msg.sender, msg.value, 0);
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    /// @inheritdoc IKritherPaymaster
    function unlockStake()
        external
        whenNotPaused
        onlyRegistryRole(PAYMASTER_ROLE)
    {
        entryPoint.unlockStake();
    }

    /*//////////////////////////////////////////////////////////////
                             CIRCUIT BREAKER
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherSubscriptions
    function pause() external onlyRegistryRole(PAUSER_ROLE) {
        _pause();
    }

    /// @inheritdoc IKritherSubscriptions
    function unpause() external onlyRegistryRole(PAUSER_ROLE) {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                                WITHDRAWALS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherPaymaster
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
        emit FundsWithdrawn("deposit", to, amount);
        entryPoint.withdrawTo(to, amount);
    }

    /// @inheritdoc IKritherPaymaster
    /// @dev The EntryPoint sends the whole stake and takes no amount, so the
    ///      figure the event reports is read back before it is emptied.
    function withdrawStake(
        address payable to
    )
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(to)
    {
        emit FundsWithdrawn(
            "stake",
            to,
            entryPoint.getDepositInfo(address(this)).stake
        );
        entryPoint.withdrawStake(to);
    }

    /// @inheritdoc IKritherPaymaster
    function withdrawRevenue(
        address payable to,
        uint256 amount
    )
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(to)
    {
        emit FundsWithdrawn("revenue", to, amount);
        (bool sent, ) = to.call{value: amount}("");
        require(sent, WithdrawFailed());
    }
}
