// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

/// @notice Single definition of every constant Krither shares between
///         contracts.
/// @dev Declared `internal`, so the compiler inlines them and the library adds
///      no bytecode and needs no linking. Contracts re-export only the values
///      their own callers read from the ABI.
library Constants {
    // ROLES

    /// @dev Retyping an identifier per contract risks a mismatch that no test
    ///      surfaces: the role simply resolves to an address nobody holds.
    bytes32 internal constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 internal constant RESELLER_ROLE = keccak256("RESELLER_ROLE");
    bytes32 internal constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // TOKEN IDS

    /// @dev Width of the item index inside a packed ERC-1155 token id.
    uint256 internal constant LOT_ID_SHIFT = 128;
}
