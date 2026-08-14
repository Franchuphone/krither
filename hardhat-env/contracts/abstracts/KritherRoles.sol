// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {
    AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    IAccessControl
} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {IKritherRoles} from "../interfaces/IKritherRoles.sol";
import {Constants} from "../libraries/Constants.sol";
import {Errors} from "./Errors.sol";

/// @notice Accreditation, producer identity and the circuit breaker.
/// @dev A producer keeps a stable id across wallet rotations, so lots never
///      need rewriting when a key is lost.
abstract contract KritherRoles is
    IKritherRoles,
    Errors,
    AccessControlEnumerable,
    Pausable
{
    bytes32 public constant PRODUCER_ROLE = Constants.PRODUCER_ROLE;
    bytes32 public constant RESELLER_ROLE = Constants.RESELLER_ROLE;
    bytes32 public constant CONSUMER_ROLE = Constants.CONSUMER_ROLE;
    bytes32 public constant PAUSER_ROLE = Constants.PAUSER_ROLE;

    uint256 private _nextProducerId;

    mapping(address => uint256) public producerByAddr;
    mapping(uint256 => address) public producerById;

    function _grantRole(
        bytes32 role,
        address account
    ) internal virtual override returns (bool) {
        bool granted = super._grantRole(role, account);
        if (granted && role == PRODUCER_ROLE && producerByAddr[account] == 0) {
            uint256 id = ++_nextProducerId;
            producerByAddr[account] = id;
            producerById[id] = account;
        }
        return granted;
    }

    /// @dev Accreditation is what the paymaster reads to decide who it pays
    ///      for, so dropping one's own role is a state change like any other
    ///      and the breaker holds it. Leaving it open would let an account walk
    ///      out of its own accreditation while an incident is being contained.
    function renounceRole(
        bytes32 role,
        address callerConfirmation
    ) public override(AccessControl, IAccessControl) whenNotPaused {
        super.renounceRole(role, callerConfirmation);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function reassignProducer(
        address oldAddress,
        address newAddress
    )
        external
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(newAddress)
    {
        require(oldAddress != newAddress, InputSimilar());
        require(hasRole(PRODUCER_ROLE, oldAddress), NotProducer());
        require(!hasRole(PRODUCER_ROLE, newAddress), AlreadyProducer());

        uint256 id = producerByAddr[oldAddress];

        producerByAddr[newAddress] = id;
        producerById[id] = newAddress;
        _grantRole(PRODUCER_ROLE, newAddress);
        _revokeRole(PRODUCER_ROLE, oldAddress);

        emit ProducerReassigned(oldAddress, newAddress, block.timestamp);
    }
}
