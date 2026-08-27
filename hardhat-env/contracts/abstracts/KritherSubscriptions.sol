// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {IKritherSubscriptions} from "../interfaces/IKritherSubscriptions.sol";
import {Constants} from "../libraries/Constants.sol";
import {Errors} from "../abstracts/Errors.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {
    IAccessControl
} from "@openzeppelin/contracts/access/IAccessControl.sol";

abstract contract KritherSubscriptions is
    IKritherSubscriptions,
    Errors,
    Pausable
{
    bytes32 public constant DEFAULT_ADMIN_ROLE = Constants.DEFAULT_ADMIN_ROLE;
    bytes32 public constant PAUSER_ROLE = Constants.PAUSER_ROLE;
    bytes32 public constant PLANS_ADMIN_ROLE = Constants.PLANS_ADMIN_ROLE;

    mapping(address => Subscription) internal _subscriptions;

    address public immutable registry;

    Plan[] internal _plans;

    constructor(address registry_) checkAddressZero(registry_) {
        registry = registry_;
    }

    /// @dev Accreditation is read live from the registry, so a revoked role
    ///      stops sponsorship without any state to keep in sync here.
    function _hasRegistryRole(
        bytes32 role,
        address account
    ) private view returns (bool) {
        return IAccessControl(registry).hasRole(role, account);
    }

    /// @dev The guard behind `onlyRegistryRole`, reachable on its own for the
    ///      checks a modifier cannot express, such as one branch of a call.
    function _requireAccredited(bytes32 role, address account) internal view {
        require(_hasRegistryRole(role, account), NotAccredited());
    }

    /// @dev The guard behind `checkPlanExists`, reachable the same way.
    function _requirePlanExists(uint8 planId) internal view {
        require(planId < _plans.length, PlanUnknown());
    }

    modifier onlyRegistryRole(bytes32 role) {
        _requireAccredited(role, msg.sender);
        _;
    }

    modifier checkPlanExists(uint8 planId) {
        _requirePlanExists(planId);
        _;
    }

    function planTerms(
        uint8 planId
    )
        external
        view
        checkPlanExists(planId)
        returns (
            bytes32 role,
            uint96 price,
            uint32 quota,
            uint32 period,
            bool enabled
        )
    {
        Plan storage plan = _plans[planId];
        role = plan.role;
        price = plan.price;
        quota = plan.quota;
        period = plan.period;
        enabled = plan.enabled;
    }

    function planCount() external view returns (uint256) {
        return _plans.length;
    }

    function addPlan(
        bytes32 role,
        uint96 price,
        uint32 quota,
        uint32 period
    )
        external
        whenNotPaused
        onlyRegistryRole(PLANS_ADMIN_ROLE)
        checkNonZero(quota)
        checkNonZero(period)
        returns (uint8 planId)
    {
        require(_plans.length < type(uint8).max, PlanLimitReached());
        planId = uint8(_plans.length);
        _plans.push(Plan(role, price, quota, period, true));
        emit PlanSet(planId, role, price, quota, period, true);
    }

    function setPlan(
        uint8 planId,
        uint96 price,
        uint32 quota,
        uint32 period,
        bool enabled
    )
        external
        whenNotPaused
        onlyRegistryRole(PLANS_ADMIN_ROLE)
        checkNonZero(quota)
        checkNonZero(period)
        checkPlanExists(planId)
    {
        Plan storage plan = _plans[planId];
        plan.price = price;
        plan.quota = quota;
        plan.period = period;
        plan.enabled = enabled;
        emit PlanSet(planId, plan.role, price, quota, period, enabled);
    }

    function subscriptions(
        address account
    )
        external
        view
        returns (
            uint8 planId,
            uint32 quota,
            uint32 used,
            uint32 period,
            uint64 periodEnd,
            uint64 expiresAt
        )
    {
        Subscription storage subscription = _subscriptions[account];
        planId = subscription.planId;
        quota = subscription.quota;
        used = subscription.used;
        period = subscription.period;
        periodEnd = subscription.periodEnd;
        expiresAt = subscription.expiresAt;
    }

    function remainingQuota(address account) external view returns (uint32) {
        Subscription storage subscription = _subscriptions[account];
        if (block.timestamp > subscription.expiresAt) {
            return 0;
        }
        if (block.timestamp > subscription.periodEnd) {
            return subscription.quota;
        }
        return subscription.quota - subscription.used;
    }

    function subscribe(
        uint8 planId
    )
        external
        payable
        whenNotPaused
        checkPlanExists(planId)
        onlyRegistryRole(_plans[planId].role)
    {
        Subscription storage subscription = _subscriptions[msg.sender];
        Plan storage plan = _plans[planId];
        require(plan.enabled, PlanDisabled());
        require(msg.value == plan.price, PriceMismatch());
        uint32 quota = plan.quota;
        uint32 used = subscription.periodEnd > block.timestamp
            ? subscription.used
            : 0;
        uint32 period = plan.period;
        uint64 periodEnd = subscription.periodEnd > block.timestamp
            ? subscription.periodEnd
            : uint64(block.timestamp + period);
        uint64 expiresAt = subscription.expiresAt > block.timestamp
            ? subscription.expiresAt + period
            : uint64(block.timestamp + period);
        _subscriptions[msg.sender] = Subscription(
            planId,
            quota,
            used,
            period,
            periodEnd,
            expiresAt
        );
        emit Subscribed(msg.sender, planId, expiresAt, quota);
    }

    function pause() external onlyRegistryRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRegistryRole(PAUSER_ROLE) {
        _unpause();
    }
}
