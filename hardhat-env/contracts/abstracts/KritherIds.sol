// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {IKritherIds} from "../interfaces/IKritherIds.sol";
import {LotId} from "../libraries/LotId.sol";

/// @notice Exposes the packed token-id scheme on the public ABI.
/// @dev Stateless: every function is a pure delegation to `LotId`, so callers
///      and integrating contracts never reimplement the packing themselves.
abstract contract KritherIds is IKritherIds {
    using LotId for uint256;

    function itemId(
        uint256 idLot,
        uint256 index
    ) public pure returns (uint256) {
        return idLot.pack(index);
    }

    function lotOf(uint256 idItem) public pure returns (uint256) {
        return idItem.lot();
    }

    function indexOf(uint256 idItem) public pure returns (uint256) {
        return idItem.index();
    }
}
