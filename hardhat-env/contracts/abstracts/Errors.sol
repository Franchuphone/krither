// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {IErrors} from "../interfaces/IErrors.sol";

/// @notice Input guards shared by every Krither contract.
/// @dev Holds only modifiers reading nothing but their own arguments; guards
///      that read state live with the state they read.
abstract contract Errors is IErrors {
    /// @notice Rejects a null quantity.
    /// @param number Value to check.
    modifier checkNonZero(uint256 number) {
        require(number > 0, InputNumberNull());
        _;
    }

    /// @notice Rejects an empty string.
    /// @param text Value to check.
    modifier checkEmptyString(string calldata text) {
        require(bytes(text).length != 0, InputStringEmpty());
        _;
    }

    /// @notice Rejects the zero address.
    /// @param addr Value to check.
    modifier checkAddressZero(address addr) {
        require(addr != address(0), InputAddressZero());
        _;
    }
}
