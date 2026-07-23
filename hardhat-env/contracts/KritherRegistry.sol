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

    uint256 private _nextIdLot;
    struct Lot {
        address producer;
        uint96 lifecycleChanges;
    }
    mapping(uint256 => Lot) public lots;

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

    constructor(address admin) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // CUSTOM ERRORS

    error InputNumberNull();
    error InputStringEmpty();
    error InputIdlotOwnershipInvalid();
    error NotHolder();

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

    // MODIFIERS

    modifier checkNonZero(uint256 number) {
        require(number > 0, InputNumberNull());
        _;
    }

    modifier checkEmptyString(string calldata text) {
        require(bytes(text).length != 0, InputStringEmpty());
        _;
    }

    modifier checkOwnership(address owner, uint256 idLot, uint256 quantity) {
        require(
            balanceOf(owner, idLot) == quantity,
            InputIdlotOwnershipInvalid()
        );
        _;
    }

    modifier onlyHolder(uint256 idLot) {
        require(balanceOf(msg.sender, idLot) != 0, NotHolder());
        _;
    }

    // INTERNAL

    // LOGICAL

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
        lots[idLot] = Lot(msg.sender, 1);
        _setURI(idLot, cid);
        _mint(msg.sender, idLot, quantity, "");
        emit LotCreated(idLot, quantity, msg.sender, cid, block.timestamp);
    }

    function addLifecycleChange(
        uint256 idLot,
        uint256 quantity,
        string calldata cid
    )
        external
        checkNonZero(quantity)
        checkEmptyString(cid)
        checkOwnership(msg.sender, idLot, quantity)
    {
        lots[idLot].lifecycleChanges++;
        _setURI(idLot, cid);
        emit LifecycleChanged(
            idLot,
            quantity,
            msg.sender,
            cid,
            block.timestamp
        );
    }
}
