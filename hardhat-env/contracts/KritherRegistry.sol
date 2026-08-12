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

import {IKritherRegistry} from "./interfaces/IKritherRegistry.sol";
import {KritherIds} from "./abstracts/KritherIds.sol";
import {KritherRoles} from "./abstracts/KritherRoles.sol";
import {LotId} from "./libraries/LotId.sol";

/// @notice On-chain provenance for small producers: a lot is one batch of
///         items, each item carrying its own ERC-1155 token id.
contract KritherRegistry is
    IKritherRegistry,
    KritherIds,
    ERC1155,
    ERC1155Pausable,
    ERC1155Supply,
    KritherRoles
{
    using Strings for uint256;
    using LotId for uint256;

    uint128 private _nextIdLot;

    mapping(uint256 => Lot) public lots;
    mapping(uint256 => uint256) public lifecycleChanges;

    constructor(address admin) ERC1155("") {
        require(admin != address(0), InputAddressZero());
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

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
        Lot storage lot = lots[idItem.lot()];
        require(lot.producer != address(0), LotNotFound());

        uint256 index = idItem.index();
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

    // MODIFIERS

    modifier onlyHolder(uint256 idItem) {
        require(balanceOf(msg.sender, idItem) != 0, NotHolder());
        _;
    }

    modifier lotExists(uint256 idLot) {
        require(lots[idLot].producer != address(0), LotNotFound());
        _;
    }

    // LOT ITEMS

    /// @notice Lists every token id minted under a lot.
    function itemsOf(
        uint256 idLot
    ) external view lotExists(idLot) returns (uint256[] memory ids) {
        uint256 count = lots[idLot].itemCount;

        ids = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            ids[i] = idLot.pack(i);
        }
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
        whenNotPaused
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
            ids[i] = idLot.pack(i);
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
    ) external whenNotPaused checkEmptyString(cid) onlyHolder(idItem) {
        lifecycleChanges[idItem]++;
        emit LifecycleChanged(
            idItem,
            idItem.lot(),
            balanceOf(msg.sender, idItem),
            msg.sender,
            cid,
            block.timestamp
        );
    }

    // ADMIN INTERACTIONS

    /// @notice Anchors an alternative storage pointer for a lot.
    function addLocator(
        uint256 idLot,
        string calldata service,
        string calldata pointer
    )
        external
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
        lotExists(idLot)
        checkEmptyString(service)
        checkEmptyString(pointer)
    {
        emit LocatorAdded(
            idLot,
            keccak256(bytes(service)),
            service,
            pointer,
            block.timestamp
        );
    }
}
