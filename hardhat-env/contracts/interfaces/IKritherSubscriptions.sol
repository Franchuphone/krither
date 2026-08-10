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

    /// @notice Allowance currently held by one account.
    /// @dev A subscription runs as a chain of windows: `periodEnd` closes the
    ///      one `used` is counting, `expiresAt` closes the last one paid for.
    ///      Renewing appends a window, so allowances never pool.
    struct Subscription {
        uint8 planId;
        uint32 quota;
        uint32 period;
        uint64 periodEnd;
        uint64 expiresAt;
        uint32 used;
    }

    event PlanSet(
        uint8 indexed planId,
        bytes32 indexed role,
        uint96 price,
        uint32 quota,
        uint32 period,
        bool enabled
    );

    event Subscribed(
        address indexed account,
        uint8 indexed planId,
        uint64 expiresAt,
        uint32 quota,
        uint256 paid
    );

    event SubscriptionCancelled(address indexed account, uint256 cancelledAt);

    /// @notice Terms sold under a plan.
    function planTerms(
        uint8 planId
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

    /// @notice Terms, window and consumption of an account's subscription.
    function subscriptions(
        address account
    )
        external
        view
        returns (
            uint8 planId,
            uint32 quota,
            uint32 period,
            uint64 periodEnd,
            uint64 expiresAt,
            uint32 used
        );

    /// @notice Transactions an account may still have sponsored this period.
    function remainingQuota(address account) external view returns (uint32);

    /// @notice Buys or renews a plan for the caller, paid in native currency.
    function subscribe(uint8 planId) external payable;

    /// @notice Ends an account's subscription immediately, without refund.
    /// @dev Open to the subscriber for their own account, and to USERS_ADMIN.
    function cancel(address account) external;

    function pause() external;

    function unpause() external;
}
