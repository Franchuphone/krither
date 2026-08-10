// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

interface IKritherSubscriptions {
    /// @notice Sponsorship terms sold against one registry role.
    struct Plan {
        bytes32 role;
        uint96 price;
        uint32 quota;
        uint32 period;
        bool enabled;
    }

    event PlanSet(
        uint8 indexed planId,
        bytes32 indexed role,
        uint96 price,
        uint32 quota,
        uint32 period,
        bool enabled
    );

    /// @notice Terms sold under a plan.
    function plans(
        uint256 planId
    )
        external
        view
        returns (
            bytes32 role,
            uint96 price,
            uint32 quota,
            uint32 period,
            bool enabled
        );

    /// @notice Number of plans ever created.
    function planCount() external view returns (uint256);

    /// @notice Creates a plan sold against a registry role.
    function addPlan(
        bytes32 role,
        uint96 price,
        uint32 quota,
        uint32 period
    ) external returns (uint8 planId);

    /// @notice Updates the terms a plan sells from now on.
    function setPlan(
        uint8 planId,
        uint96 price,
        uint32 quota,
        uint32 period,
        bool enabled
    ) external;
}
