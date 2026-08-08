// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {IErrors} from "../interfaces/IErrors.sol";

/// @notice Input guards shared by every Krither contract.
/// @dev Only holds modifiers reading nothing but their own arguments;
///      guards that read state live with the state they read.
abstract contract Errors is IErrors {
    modifier checkNonZero(uint256 number) {
        require(number > 0, InputNumberNull());
        _;
    }

    modifier checkEmptyString(string calldata text) {
        require(bytes(text).length != 0, InputStringEmpty());
        _;
    }

    modifier checkAddressZero(address addr) {
        require(addr != address(0), InputAddressZero());
        _;
    }
}
