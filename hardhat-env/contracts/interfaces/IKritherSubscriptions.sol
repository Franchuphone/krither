// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/// @notice Plans an accredited actor buys, and the windows a purchase opens.
interface IKritherSubscriptions {
    /*//////////////////////////////////////////////////////////////
                                  TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Sponsorship terms sold against one registry role.
    /// @param role Registry role a buyer must hold.
    /// @param price Native currency the plan costs, per window.
    /// @param quota Transactions a window carries.
    /// @param period Length of a window, in seconds.
    /// @param enabled Whether the plan still sells.
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
    /// @param planId Plan the subscription was bought against.
    /// @param quota Transactions each window carries.
    /// @param used Transactions spent in the window in progress.
    /// @param period Length of a window, in seconds.
    /// @param periodEnd Close of the window in progress.
    /// @param expiresAt Close of the last window paid for.
    struct Subscription {
        uint8 planId;
        uint32 quota;
        uint32 used;
        uint32 period;
        uint64 periodEnd;
        uint64 expiresAt;
    }

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a plan is opened or its terms are rewritten.
    /// @param planId Plan the terms belong to.
    /// @param role Registry role the plan sells against.
    /// @param price Native currency the plan costs, per window.
    /// @param quota Transactions a window carries.
    /// @param period Length of a window, in seconds.
    /// @param enabled Whether the plan still sells.
    event PlanSet(
        uint8 indexed planId,
        bytes32 indexed role,
        uint96 price,
        uint32 quota,
        uint32 period,
        bool enabled
    );

    /// @notice Emitted when an account buys or renews a plan.
    /// @param account Wallet the subscription belongs to.
    /// @param planId Plan bought.
    /// @param expiresAt Close of the last window now paid for.
    /// @param quota Transactions each window carries.
    event Subscribed(
        address indexed account,
        uint8 indexed planId,
        uint64 expiresAt,
        uint32 quota
    );

    /*//////////////////////////////////////////////////////////////
                                  READS
    //////////////////////////////////////////////////////////////*/

    /// @notice Registry every accreditation is read from.
    /// @return Address of the registry.
    function registry() external view returns (address);

    /// @notice Terms sold under a plan.
    /// @param planId Plan to look up.
    /// @return role Registry role the plan sells against.
    /// @return price Native currency the plan costs, per window.
    /// @return quota Transactions a window carries.
    /// @return period Length of a window, in seconds.
    /// @return enabled Whether the plan still sells.
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
    /// @return Plans opened so far.
    function planCount() external view returns (uint256);

    /// @notice Terms, window and consumption of an account's subscription.
    /// @param account Wallet to look up.
    /// @return planId Plan the subscription was bought against.
    /// @return quota Transactions each window carries.
    /// @return used Transactions spent in the window in progress.
    /// @return period Length of a window, in seconds.
    /// @return periodEnd Close of the window in progress.
    /// @return expiresAt Close of the last window paid for.
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
        );

    /// @notice Transactions an account may still have sponsored this period.
    /// @param account Wallet to look up.
    /// @return Transactions left, zero once the subscription has closed.
    function remainingQuota(address account) external view returns (uint32);

    /*//////////////////////////////////////////////////////////////
                                  WRITES
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a plan sold against a registry role.
    /// @param role Registry role a buyer must hold.
    /// @param price Native currency the plan costs, per window.
    /// @param quota Transactions a window carries.
    /// @param period Length of a window, in seconds.
    /// @return planId Identifier of the created plan.
    function addPlan(
        bytes32 role,
        uint96 price,
        uint32 quota,
        uint32 period
    ) external returns (uint8 planId);

    /// @notice Updates the terms a plan sells from now on.
    /// @param planId Plan to rewrite.
    /// @param price Native currency the plan costs, per window.
    /// @param quota Transactions a window carries.
    /// @param period Length of a window, in seconds.
    /// @param enabled Whether the plan still sells.
    function setPlan(
        uint8 planId,
        uint96 price,
        uint32 quota,
        uint32 period,
        bool enabled
    ) external;

    /// @notice Buys or renews a plan for the caller, paid in native currency.
    /// @param planId Plan to buy.
    function subscribe(uint8 planId) external payable;

    /// @notice Freezes every state-changing operation.
    function pause() external;

    /// @notice Lifts the freeze.
    function unpause() external;
}
