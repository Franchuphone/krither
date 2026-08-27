// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {Constants} from "./Constants.sol";

/// @notice Packs a lot id and an item index into a single ERC-1155 token id.
/// @dev Upper 128 bits hold the lot, lower 128 bits the item's position in it.
library LotId {
    /// @notice Builds the token id of one item of a lot.
    /// @param idLot Lot the item belongs to.
    /// @param itemIndex Position of the item inside the lot.
    /// @return Packed item id.
    function pack(
        uint256 idLot,
        uint256 itemIndex
    ) internal pure returns (uint256) {
        return (idLot << Constants.LOT_ID_SHIFT) | itemIndex;
    }

    /// @notice Reads the lot out of a packed item id.
    /// @param idItem Packed item id.
    /// @return Lot the item belongs to.
    function lot(uint256 idItem) internal pure returns (uint256) {
        return idItem >> Constants.LOT_ID_SHIFT;
    }

    /// @notice Reads the item's position out of a packed item id.
    /// @param idItem Packed item id.
    /// @return Position of the item inside its lot.
    function index(uint256 idItem) internal pure returns (uint256) {
        return uint256(uint128(idItem));
    }
}
