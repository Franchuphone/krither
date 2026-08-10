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
    bytes32 public constant USERS_ADMIN_ROLE = Constants.USERS_ADMIN_ROLE;

    address public immutable registry;

    Plan[] internal plans;

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

    modifier onlyRegistryRole(bytes32 role) {
        require(_hasRegistryRole(role, msg.sender), NotAccredited());
        _;
    }

    modifier checkPlanExists(uint8 planId) {
        require(planId < plans.length, PlanUnknown());
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
        Plan storage plan = plans[planId];
        role = plan.role;
        price = plan.price;
        quota = plan.quota;
        period = plan.period;
        enabled = plan.enabled;
    }

    function planCount() external view returns (uint256) {
        return plans.length;
    }

    function addPlan(
        bytes32 role,
        uint96 price,
        uint32 quota,
        uint32 period
    )
        external
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkNonZero(quota)
        checkNonZero(period)
        returns (uint8 planId)
    {
        require(plans.length < type(uint8).max, PlanLimitReached());
        planId = uint8(plans.length);
        plans.push(Plan(role, price, quota, period, true));
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
        onlyRegistryRole(DEFAULT_ADMIN_ROLE)
        checkNonZero(quota)
        checkNonZero(period)
        checkPlanExists(planId)
    {
        Plan storage plan = plans[planId];
        plan.price = price;
        plan.quota = quota;
        plan.period = period;
        plan.enabled = enabled;
        emit PlanSet(planId, plan.role, price, quota, period, enabled);
    }
}
