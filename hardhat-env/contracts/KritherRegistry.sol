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
    AccessControlEnumerable
} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract KritherRegistry is
    ERC1155,
    ERC1155Pausable,
    ERC1155Supply,
    AccessControlEnumerable
{
    using Strings for uint256;

    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant RESELLER_ROLE = keccak256("RESELLER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 private constant LOT_SHIFT = 128;

    uint128 private _nextIdLot;
    uint128 private _nextProducerId;
    struct Lot {
        address producer;
        uint96 itemCount;
        string cid;
    }

    mapping(uint256 => Lot) public lots;
    mapping(uint256 => uint256) public lifecycleChanges;
    mapping(address => uint256) public producerByAddr;
    mapping(uint256 => address) public producerById;

    event LotCreated(
        uint256 indexed idLot,
        address indexed producer,
        string cid,
        uint256[] quantities,
        uint256 createdAt
    );

    event LifecycleChanged(
        uint256 indexed idItem,
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
    error ItemNotFound();
    error AlreadyProducer();

    // OVERRIDE FUNCTIONS

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControlEnumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Resolves an item to its JSON inside the lot's metadata directory.
    /// @param idItem Packed item id, `(idLot << 128) | index`.
    /// @return The lot directory CID suffixed with the item's index.
    function uri(uint256 idItem) public view override returns (string memory) {
        Lot storage lot = lots[idItem >> LOT_SHIFT];
        require(lot.producer != address(0), LotNotFound());

        uint256 index = uint256(uint128(idItem));
        require(index < lot.itemCount, ItemNotFound());

        return string.concat(lot.cid, "/", index.toString(), ".json");
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

    modifier onlyHolder(uint256 idItem) {
        require(balanceOf(msg.sender, idItem) != 0, NotHolder());
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

    // ID PACKING

    /// @notice Builds the token id of an item within a lot.
    function itemId(
        uint256 idLot,
        uint256 index
    ) public pure returns (uint256) {
        return (idLot << LOT_SHIFT) | index;
    }

    /// @notice Extracts the lot an item belongs to.
    function lotOf(uint256 idItem) public pure returns (uint256) {
        return idItem >> LOT_SHIFT;
    }

    /// @notice Extracts the position of an item inside its lot.
    function indexOf(uint256 idItem) public pure returns (uint256) {
        return uint256(uint128(idItem));
    }

    /// @notice Lists every token id minted under a lot.
    function itemsOf(
        uint256 idLot
    ) external view lotExists(idLot) returns (uint256[] memory ids) {
        uint256 count = lots[idLot].itemCount;
        uint256 base = idLot << LOT_SHIFT;

        ids = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            ids[i] = base | i;
        }
    }

    // PAUSABLE MECHANISM

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // PRODUCT LIFECYCLE

    /// @notice Mints a lot as a single batch, one token id per item.
    /// @param quantities Units minted for each item, in directory order.
    /// @param cid Metadata directory CID holding one `<index>.json` per item.
    /// @return idLot Identifier of the created lot.
    function mintLot(
        uint256[] calldata quantities,
        string calldata cid
    )
        external
        onlyRole(PRODUCER_ROLE)
        checkNonZero(quantities.length)
        checkEmptyString(cid)
        returns (uint256 idLot)
    {
        idLot = ++_nextIdLot;
        lots[idLot] = Lot(msg.sender, uint96(quantities.length), cid);

        uint256[] memory ids = new uint256[](quantities.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            require(quantities[i] > 0, InputNumberNull());
            ids[i] = (idLot << LOT_SHIFT) | i;
        }

        _mintBatch(msg.sender, ids, quantities, "");
        emit LotCreated(idLot, msg.sender, cid, quantities, block.timestamp);
    }

    /// @notice Records a lifecycle step against one item of a lot.
    /// @param idItem Packed item id the caller holds units of.
    /// @param cid Metadata CID describing the step.
    function addLifecycleChange(
        uint256 idItem,
        string calldata cid
    ) external checkEmptyString(cid) onlyHolder(idItem) whenNotPaused {
        lifecycleChanges[idItem]++;
        emit LifecycleChanged(
            idItem,
            idItem >> LOT_SHIFT,
            balanceOf(msg.sender, idItem),
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
