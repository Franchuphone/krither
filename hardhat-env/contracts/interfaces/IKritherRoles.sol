// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/// @notice Accreditation, producer identity and the circuit breaker.
interface IKritherRoles {
    /// @notice Emitted when a producer id moves onto a new wallet.
    /// @param oldAddress Wallet losing the accreditation.
    /// @param newAddress Wallet now holding the producer id.
    /// @param changedAt Block timestamp of the reassignment.
    event ProducerReassigned(
        address indexed oldAddress,
        address indexed newAddress,
        uint256 changedAt
    );

    /// @notice Stable id assigned to a producer on accreditation.
    /// @param account Wallet to look up.
    /// @return Producer id, zero if the address was never accredited.
    function producerByAddr(address account) external view returns (uint256);

    /// @notice Wallet currently holding a producer id.
    /// @param id Producer id to look up.
    /// @return Current wallet, zero address if the id was never assigned.
    function producerById(uint256 id) external view returns (address);

    /// @notice Moves a producer id and its role onto a new wallet.
    /// @param oldAddress Wallet losing the accreditation.
    /// @param newAddress Wallet taking it over.
    function reassignProducer(address oldAddress, address newAddress) external;

    /// @notice Freezes every state-changing operation.
    function pause() external;

    /// @notice Lifts the freeze.
    function unpause() external;
}
