// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {IKritherSubscriptions} from "../interfaces/IKritherSubscriptions.sol";
import {Constants} from "../libraries/Constants.sol";
import {Errors} from "../abstracts/Errors.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {
    IAccessControl
} from "@openzeppelin/contracts/access/IAccessControl.sol";

/// @notice Plans an accredited actor buys, and the windows a purchase opens.
/// @dev Holds no accreditation of its own: every role is read live from the
///      registry.
abstract contract KritherSubscriptions is
    IKritherSubscriptions,
    Errors,
    Pausable
{
    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant PLANS_ADMIN_ROLE = Constants.PLANS_ADMIN_ROLE;

    mapping(address account => Subscription) internal _subscriptions;

    /// @inheritdoc IKritherSubscriptions
    address public immutable registry;

    Plan[] internal _plans;

    /// @param registry_ Registry every accreditation is read from.
    constructor(address registry_) checkAddressZero(registry_) {
        registry = registry_;
    }

    /*//////////////////////////////////////////////////////////////
                                  GUARDS
    //////////////////////////////////////////////////////////////*/

    /// @notice Reads an accreditation off the registry.
    /// @dev Read live, so a revoked role stops sponsorship with no state to
    ///      keep in sync here.
    /// @param role Role to look for.
    /// @param account Wallet to check.
    /// @return Whether the account holds it.
    function _hasRegistryRole(
        bytes32 role,
        address account
    ) private view returns (bool) {
        return IAccessControl(registry).hasRole(role, account);
    }

    /// @notice Reverts unless the account holds the role.
    /// @dev The guard behind `onlyRegistryRole`, reachable on its own for the
    ///      checks a modifier cannot express, such as one branch of a call.
    /// @param role Role required.
    /// @param account Wallet to check.
    function _requireAccredited(bytes32 role, address account) internal view {
        require(_hasRegistryRole(role, account), NotAccredited());
    }

    /// @notice Reverts unless the plan exists.
    /// @dev The guard behind `checkPlanExists`, reachable the same way.
    /// @param planId Plan to check.
    function _requirePlanExists(uint8 planId) internal view {
        require(planId < _plans.length, PlanUnknown());
    }

    /// @notice Restricts a call to a holder of the registry role.
    /// @param role Role required.
    modifier onlyRegistryRole(bytes32 role) {
        _requireAccredited(role, msg.sender);
        _;
    }

    /// @notice Rejects a plan id that was never opened.
    /// @param planId Plan to check.
    modifier checkPlanExists(uint8 planId) {
        _requirePlanExists(planId);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                                  PLANS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherSubscriptions
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

    /// @inheritdoc IKritherSubscriptions
    function planCount() external view returns (uint256) {
        return _plans.length;
    }

    /// @inheritdoc IKritherSubscriptions
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

    /// @inheritdoc IKritherSubscriptions
    /// @dev The role a plan sells against is never rewritten: subscriptions
    ///      already bought against it would change meaning.
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

    /*//////////////////////////////////////////////////////////////
                              SUBSCRIPTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherSubscriptions
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

    /// @inheritdoc IKritherSubscriptions
    /// @dev A window that has rolled reports the full quota without writing;
    ///      the refill is booked by the next operation settled.
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

    /// @inheritdoc IKritherSubscriptions
    /// @dev A renewal appends a window rather than restarting one: the window
    ///      in progress keeps its quota and its end.
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

}
