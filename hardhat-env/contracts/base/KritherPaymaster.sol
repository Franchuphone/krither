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
    IEntryPoint public immutable entryPoint;

    uint256 public maxCostPerOp;

    mapping(address => bool) public sponsoredTargets;

    mapping(address => bool) public onboardingUsed;

    constructor(
        address registry_,
        address entryPoint_
    ) KritherSubscriptions(registry_) checkAddressZero(entryPoint_) {
        entryPoint = IEntryPoint(entryPoint_);
        sponsoredTargets[registry_] = true;
        sponsoredTargets[address(this)] = true;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), NotEntryPoint());
        _;
    }

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

        /// @dev The free operation is what an accredited actor rides in on, so
        ///      it is gated on the accreditation the plan sells against.
        ///      Ungated, anyone could mint accounts and spend the gas budget
        ///      one free operation at a time.
        if (onboarding && lapsed && !onboardingUsed[userOp.sender]) {
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

        if (onboarding) {
            onboardingUsed[account] = true;
            emit OnboardingSponsored(account, actualGasCost);
            return;
        }

        Subscription storage subscription = _subscriptions[account];
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
            subscription.used = 1;
            subscription.periodEnd = uint64(
                block.timestamp + subscription.period
            );
        }

        emit OperationSponsored(
            account,
            actualGasCost,
            subscription.quota - subscription.used
        );
    }

    function setMaxCostPerOp(
        uint256 newMaxCostPerOp
    ) external whenNotPaused onlyRegistryRole(DEFAULT_ADMIN_ROLE) {
        maxCostPerOp = newMaxCostPerOp;
        emit MaxCostPerOpSet(newMaxCostPerOp);
    }

    function setSponsoredTarget(
        address target,
        bool allowed
    )
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(target)
    {
        sponsoredTargets[target] = allowed;
        emit SponsoredTargetSet(target, allowed);
    }

    function entryPointBalance() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function depositToEntryPoint(
        uint256 amount
    ) external whenNotPaused onlyRegistryRole(DEFAULT_ADMIN_ROLE) {
        entryPoint.depositTo{value: amount}(address(this));
    }

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

    function addStake(
        uint32 unstakeDelaySec
    ) external payable whenNotPaused onlyRegistryRole(DEFAULT_ADMIN_ROLE) {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    function unlockStake()
        external
        whenNotPaused
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
    {
        entryPoint.unlockStake();
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
