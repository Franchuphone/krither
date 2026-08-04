// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {
    ERC1155Pausable
} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {
    ERC1155Supply
} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {
    ERC1155URIStorage
} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import {
    AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract KritherRegistry is
    ERC1155,
    ERC1155Pausable,
    ERC1155Supply,
    ERC1155URIStorage,
    AccessControlEnumerable
{
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant RESELLER_ROLE = keccak256("RESELLER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint128 private _nextIdLot;
    uint128 private _nextProducerId;
    struct Lot {
        address producer;
        uint96 lifecycleChanges;
    }
    mapping(uint256 => Lot) public lots;
    mapping(address => uint256) public producerByAddr;
    mapping(uint256 => address) public producerById;

    event LotCreated(
        uint256 indexed idLot,
        uint256 quantity,
        address indexed producer,
        string cid,
        uint256 createdAt
    );

    event LifecycleChanged(
        uint256 indexed idLot,
        uint256 quantity,
        address indexed owner,
        string cid,
        uint256 changedAt
    );

    event ProducerReassigned(
        address indexed oldAddress,
        address indexed newAddress,
        uint256 changedAt
    );

    event LocatorAdded(
        uint256 indexed idLot,
        bytes32 indexed serviceKey,
        string service,
        string pointer,
        uint256 addedAt
    );

    constructor(address admin) ERC1155("") {
        require(admin != address(0), InputAddressZero());
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // CUSTOM ERRORS

    error InputNumberNull();
    error InputStringEmpty();
    error InputAddressZero();
    error InputSimilar();
    error NotHolder();
    error NotProducer();
    error LotNotFound();
    error AlreadyProducer();

    // OVERRIDE FUNCTIONS

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControlEnumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function uri(
        uint256 tokenId
    ) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function _grantRole(
        bytes32 role,
        address account
    ) internal override returns (bool) {
        bool granted = super._grantRole(role, account);
        if (granted && role == PRODUCER_ROLE && producerByAddr[account] == 0) {
            uint256 id = ++_nextProducerId;
            producerByAddr[account] = id;
            producerById[id] = account;
        }
        return granted;
    }

    // MODIFIERS

    modifier checkNonZero(uint256 number) {
        require(number > 0, InputNumberNull());
        _;
    }

    modifier checkEmptyString(string calldata text) {
        require(bytes(text).length != 0, InputStringEmpty());
        _;
    }

    modifier onlyHolder(uint256 idLot) {
        require(balanceOf(msg.sender, idLot) != 0, NotHolder());
        _;
    }

    modifier checkAddressZero(address addr) {
        require(addr != address(0), InputAddressZero());
        _;
    }

    modifier lotExists(uint256 idLot) {
        require(lots[idLot].producer != address(0), LotNotFound());
        _;
    }

    // PAUSABLE MECHANISM

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // PRODUCT LIFECYCLE

    function mintLot(
        uint256 quantity,
        string calldata cid
    )
        external
        onlyRole(PRODUCER_ROLE)
        checkNonZero(quantity)
        checkEmptyString(cid)
        returns (uint256 idLot)
    {
        idLot = ++_nextIdLot;
        lots[idLot] = Lot(msg.sender, 0);
        _setURI(idLot, cid);
        _mint(msg.sender, idLot, quantity, "");
        emit LotCreated(idLot, quantity, msg.sender, cid, block.timestamp);
    }

    function addLifecycleChange(
        uint256 idLot,
        string calldata cid
    )
        external
        checkEmptyString(cid)
        onlyHolder(idLot)
        whenNotPaused
    {
        lots[idLot].lifecycleChanges++;
        emit LifecycleChanged(
            idLot,
            balanceOf(msg.sender, idLot),
            msg.sender,
            cid,
            block.timestamp
        );
    }

    // ADMIN INTERACTIONS

    function addLocator(
        uint256 idLot,
        string calldata service,
        string calldata pointer
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        lotExists(idLot)
        checkEmptyString(service)
        checkEmptyString(pointer)
        whenNotPaused
    {
        emit LocatorAdded(
            idLot,
            keccak256(bytes(service)),
            service,
            pointer,
            block.timestamp
        );
    }

    function reassignProducer(
        address oldAddress,
        address newAddress
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        checkAddressZero(newAddress)
        whenNotPaused
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
