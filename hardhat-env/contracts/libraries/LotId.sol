// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

/// @notice Packs a lot id and an item index into a single ERC-1155 token id.
/// @dev Upper 128 bits hold the lot, lower 128 bits the item's position in it.
library LotId {
    uint256 internal constant SHIFT = 128;

    function pack(
        uint256 idLot,
        uint256 itemIndex
    ) internal pure returns (uint256) {
        return (idLot << SHIFT) | itemIndex;
    }

    function lot(uint256 idItem) internal pure returns (uint256) {
        return idItem >> SHIFT;
    }

    function index(uint256 idItem) internal pure returns (uint256) {
        return uint256(uint128(idItem));
    }
}
