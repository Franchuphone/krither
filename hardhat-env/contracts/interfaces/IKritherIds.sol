// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/// @notice Packed token-id scheme: one ERC-1155 id per item of a lot.
interface IKritherIds {
    /// @notice Builds the token id of an item within a lot.
    /// @param idLot Lot the item belongs to.
    /// @param index Position of the item inside the lot.
    /// @return Packed item id.
    function itemId(
        uint256 idLot,
        uint256 index
    ) external pure returns (uint256);

    /// @notice Extracts the lot an item belongs to.
    /// @param idItem Packed item id.
    /// @return Lot the item belongs to.
    function lotOf(uint256 idItem) external pure returns (uint256);

    /// @notice Extracts the position of an item inside its lot.
    /// @param idItem Packed item id.
    /// @return Position of the item inside its lot.
    function indexOf(uint256 idItem) external pure returns (uint256);
}
