// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {
    SimpleAccountFactory
} from "@account-abstraction/contracts/accounts/SimpleAccountFactory.sol";
import {
    IEntryPoint
} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/// @notice Reference ERC-4337 account factory, deployed unmodified.
/// @dev The paymaster reads a target out of `execute` and `executeBatch`
///      alone, which is how a `SimpleAccount` forwards a call, so the accounts
///      this builds are the ones it can sponsor.
/// @dev Hardhat only emits artifacts for contracts declared in project
///      sources, hence the empty subclass. It adds no code of its own.
contract KritherAccountFactory is SimpleAccountFactory {
    constructor(IEntryPoint entryPoint_) SimpleAccountFactory(entryPoint_) {}
}
