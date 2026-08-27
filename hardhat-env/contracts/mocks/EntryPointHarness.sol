// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {EntryPoint} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {
    SimpleAccount
} from "@account-abstraction/contracts/accounts/SimpleAccount.sol";
import {
    IEntryPoint
} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/// @notice Canonical EntryPoint v0.8, pulled into the build so tests can push
///         real user operations at the paymaster.
/// @dev Hardhat only emits artifacts for contracts declared in project
///      sources, hence the empty subclass.
contract TestEntryPoint is EntryPoint {}

/// @notice Reference ERC-4337 account, so every Krither actor in the paymaster
///         suite is a smart account rather than an EOA.
/// @dev Owned from the constructor, skipping the proxy the reference factory
///      builds: the paymaster never reads how an account was created.
contract TestAccount is SimpleAccount {
    /// @param entryPoint_ EntryPoint the account answers to.
    /// @param owner_ Wallet signing for the account.
    constructor(
        IEntryPoint entryPoint_,
        address owner_
    ) SimpleAccount(entryPoint_) {
        _initialize(owner_);
    }
}
