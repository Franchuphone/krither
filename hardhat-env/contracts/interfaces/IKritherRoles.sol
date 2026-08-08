// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

interface IKritherRoles {
    event ProducerReassigned(
        address indexed oldAddress,
        address indexed newAddress,
        uint256 changedAt
    );

    /// @notice Stable id assigned to a producer on accreditation.
    function producerByAddr(address account) external view returns (uint256);

    /// @notice Wallet currently holding a producer id.
    function producerById(uint256 id) external view returns (address);

    /// @notice Moves a producer id and its role onto a new wallet.
    function reassignProducer(address oldAddress, address newAddress) external;

    function pause() external;

    function unpause() external;
}
