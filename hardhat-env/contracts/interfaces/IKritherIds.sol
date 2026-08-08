// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

interface IKritherIds {
    /// @notice Builds the token id of an item within a lot.
    function itemId(
        uint256 idLot,
        uint256 index
    ) external pure returns (uint256);

    /// @notice Extracts the lot an item belongs to.
    function lotOf(uint256 idItem) external pure returns (uint256);

    /// @notice Extracts the position of an item inside its lot.
    function indexOf(uint256 idItem) external pure returns (uint256);
}
