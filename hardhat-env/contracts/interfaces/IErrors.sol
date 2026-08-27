// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/// @notice Every custom error Krither reverts with.
interface IErrors {
    /*//////////////////////////////////////////////////////////////
                                  INPUTS
    //////////////////////////////////////////////////////////////*/

    /// @notice A quantity was zero.
    error InputNumberNull();

    /// @notice A string argument was empty.
    error InputStringEmpty();

    /// @notice An address argument was the zero address.
    error InputAddressZero();

    /// @notice Two addresses that must differ were the same.
    error InputSimilar();

    /*//////////////////////////////////////////////////////////////
                            LOTS AND ITEMS
    //////////////////////////////////////////////////////////////*/

    /// @notice The caller holds no unit of the item.
    error NotHolder();

    /// @notice No lot carries this id.
    error LotNotFound();

    /// @notice The producer already used this reference.
    error LotAlreadyExists();

    /// @notice The lot holds no item at this index.
    error ItemNotFound();

    /*//////////////////////////////////////////////////////////////
                              ACCREDITATION
    //////////////////////////////////////////////////////////////*/

    /// @notice The address holds no producer accreditation.
    error NotProducer();

    /// @notice The address is already accredited as a producer.
    error AlreadyProducer();

    /// @notice The account does not hold the role the operation requires.
    error NotAccredited();

    /*//////////////////////////////////////////////////////////////
                         PLANS AND SUBSCRIPTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice No plan carries this id.
    error PlanUnknown();

    /// @notice The plan is retired and sells nothing.
    error PlanDisabled();

    /// @notice The plan id space is full.
    error PlanLimitReached();

    /// @notice The value sent does not match the plan's price.
    error PriceMismatch();

    /// @notice The subscription has spent the quota of its last window.
    error QuotaExhausted();

    /// @notice The subscription closed and buys nothing.
    error SubscriptionExpired();

    /*//////////////////////////////////////////////////////////////
                               SPONSORSHIP
    //////////////////////////////////////////////////////////////*/

    /// @notice The caller is not the EntryPoint.
    error NotEntryPoint();

    /// @notice The operation calls a contract outside Krither.
    error TargetNotAllowed();

    /// @notice The call data does not match a shape a target can be read from.
    error CallShapeUnsupported();

    /// @notice The operation costs more than the ceiling allows.
    error CostTooHigh();

    /// @notice The transfer out of the contract failed.
    error WithdrawFailed();
}
