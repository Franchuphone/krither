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
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 internal constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 internal constant RESELLER_ROLE = keccak256("RESELLER_ROLE");
    bytes32 internal constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 internal constant USERS_ADMIN_ROLE = keccak256("USERS_ADMIN_ROLE");

    // TOKEN IDS

    /// @dev Width of the item index inside a packed ERC-1155 token id.
    uint256 internal constant LOT_ID_SHIFT = 128;

    // ACCOUNT CALL SHAPES

    /// @dev The two ways a reference ERC-4337 account forwards a call, and the
    ///      only two the paymaster can read a target out of.
    bytes4 internal constant EXECUTE_SELECTOR =
        bytes4(keccak256("execute(address,uint256,bytes)"));
    bytes4 internal constant EXECUTE_BATCH_SELECTOR =
        bytes4(keccak256("executeBatch((address,uint256,bytes)[])"));

    /// @dev Call an account may make once before it pays for anything.
    bytes4 internal constant SUBSCRIBE_SELECTOR =
        bytes4(keccak256("subscribe(uint8)"));

    /// @dev Selector plus the word its plan id is padded into, so the id sits
    ///      in the final byte.
    uint256 internal constant SUBSCRIBE_CALL_LENGTH = 36;

    // USER OPERATIONS

    /// @dev Offset of the `validUntil` field inside a packed validation
    ///      result, which sits just above the 20-byte authorizer.
    uint256 internal constant VALID_UNTIL_SHIFT = 160;
}
