// SPDX-License-Identifier: MIT
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
    /*//////////////////////////////////////////////////////////////
                                  ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant PRODUCER_ROLE = Constants.PRODUCER_ROLE;
    bytes32 public constant RESELLER_ROLE = Constants.RESELLER_ROLE;
    bytes32 public constant CONSUMER_ROLE = Constants.CONSUMER_ROLE;
    bytes32 public constant USERS_ADMIN_ROLE = Constants.USERS_ADMIN_ROLE;

    /*//////////////////////////////////////////////////////////////
                            PRODUCER IDENTITY
    //////////////////////////////////////////////////////////////*/

    uint256 private _nextProducerId;

    /// @inheritdoc IKritherRoles
    mapping(address account => uint256 idProducer) public producerByAddr;

    /// @inheritdoc IKritherRoles
    mapping(uint256 idProducer => address account) public producerById;

    /// @dev Accrediting users is its own job, kept apart from the admin that
    ///      owns the contract itself.
    constructor() {
        _setRoleAdmin(PRODUCER_ROLE, USERS_ADMIN_ROLE);
        _setRoleAdmin(RESELLER_ROLE, USERS_ADMIN_ROLE);
        _setRoleAdmin(CONSUMER_ROLE, USERS_ADMIN_ROLE);
    }

    /// @notice Grants a role, assigning a producer id on a first accreditation.
    /// @dev Guarded on `producerByAddr`, so a re-accreditation hands the
    ///      original id back rather than consuming a new one.
    /// @param role Role to grant.
    /// @param account Wallet receiving it.
    /// @return Whether the role was not already held.
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

    /// @notice Drops one of the caller's own roles.
    /// @dev Held by the breaker: accreditation is what the paymaster reads to
    ///      decide who it pays for, so an account must not walk out of its own
    ///      while an incident is being contained.
    /// @param role Role to drop.
    /// @param callerConfirmation Must be the caller's own address.
    function renounceRole(
        bytes32 role,
        address callerConfirmation
    ) public override(AccessControl, IAccessControl) whenNotPaused {
        super.renounceRole(role, callerConfirmation);
    }

    /*//////////////////////////////////////////////////////////////
                          PRODUCER REASSIGNMENT
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherRoles
    /// @dev Repointing the id re-attributes every lot the old wallet ever
    ///      minted in one transaction; `lots[].producer` stays the original.
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
