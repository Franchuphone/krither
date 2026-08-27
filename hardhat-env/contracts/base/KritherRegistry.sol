// SPDX-License-Identifier: MIT
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

import {IKritherRegistry} from "../interfaces/IKritherRegistry.sol";
import {IKritherRoles} from "../interfaces/IKritherRoles.sol";
import {KritherIds} from "../abstracts/KritherIds.sol";
import {KritherRoles} from "../abstracts/KritherRoles.sol";
import {Constants} from "../libraries/Constants.sol";
import {LotId} from "../libraries/LotId.sol";

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

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant PAUSER_ROLE = Constants.PAUSER_ROLE;

    uint128 private _nextIdLot;

    /// @inheritdoc IKritherRegistry
    mapping(uint256 idLot => Lot) public lots;

    /// @inheritdoc IKritherRegistry
    mapping(uint256 idProducer => mapping(uint256 ref => uint256 idLot))
        public lotIds;

    /// @inheritdoc IKritherRegistry
    mapping(uint256 idItem => uint256 count) public lifecycleChanges;

    /// @param admin Wallet receiving `DEFAULT_ADMIN_ROLE`.
    constructor(address admin) ERC1155("") {
        require(admin != address(0), InputAddressZero());
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts a call to an account holding units of the item.
    /// @param idItem Packed item id.
    modifier onlyHolder(uint256 idItem) {
        require(balanceOf(msg.sender, idItem) != 0, NotHolder());
        _;
    }

    /// @notice Rejects a lot that was never minted.
    /// @param idLot Lot to check.
    modifier lotExists(uint256 idLot) {
        require(lots[idLot].producer != address(0), LotNotFound());
        _;
    }

    /*//////////////////////////////////////////////////////////////
                                OVERRIDES
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc ERC1155
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

    /// @inheritdoc ERC1155
    /// @dev `ERC1155Pausable` only hooks `_update`, so approvals would keep
    ///      writing while the breaker is on; a paused contract writes nothing.
    function setApprovalForAll(
        address operator,
        bool approved
    ) public override whenNotPaused {
        super.setApprovalForAll(operator, approved);
    }

    /// @inheritdoc ERC1155
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    /*//////////////////////////////////////////////////////////////
                                LOT ITEMS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherRegistry
    function itemsOf(
        uint256 idLot
    ) external view lotExists(idLot) returns (uint256[] memory ids) {
        uint256 count = lots[idLot].itemCount;

        ids = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            ids[i] = idLot.pack(i);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            PRODUCT LIFECYCLE
    //////////////////////////////////////////////////////////////*/

    /// @notice Builds the token ids of a lot, rejecting a null quantity.
    /// @param idLot Lot the items belong to.
    /// @param quantities Units minted for each item, in directory order.
    /// @return ids Packed item ids, in the same order.
    function _packIds(
        uint256 idLot,
        uint256[] calldata quantities
    ) private pure returns (uint256[] memory ids) {
        ids = new uint256[](quantities.length);
        for (uint256 i = 0; i < ids.length; ++i) {
            require(quantities[i] > 0, InputNumberNull());
            ids[i] = idLot.pack(i);
        }
    }

    /// @inheritdoc IKritherRegistry
    /// @dev Keyed on the producer id, so a reference stays taken across a
    ///      wallet rotation and every lot stays reachable from it.
    function mintLot(
        uint256[] calldata quantities,
        string calldata cid,
        uint256 ref
    )
        external
        whenNotPaused
        onlyRole(PRODUCER_ROLE)
        checkNonZero(quantities.length)
        checkEmptyString(cid)
        returns (uint256 idLot)
    {
        uint256 idProducer = producerByAddr[msg.sender];
        require(lotIds[idProducer][ref] == 0, LotAlreadyExists());

        idLot = ++_nextIdLot;
        lots[idLot] = Lot(msg.sender, uint96(quantities.length), cid);
        lotIds[idProducer][ref] = idLot;

        _mintBatch(msg.sender, _packIds(idLot, quantities), quantities, "");
        emit LotCreated(
            idLot,
            idProducer,
            msg.sender,
            ref,
            cid,
            quantities,
            block.timestamp
        );
    }

    /// @inheritdoc IKritherRegistry
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

    /*//////////////////////////////////////////////////////////////
                             CIRCUIT BREAKER
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherRoles
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @inheritdoc IKritherRoles
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                             LOCATOR INDEXER
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IKritherRegistry
    /// @dev Anchored in an event only: a locator mirrors the metadata, it is
    ///      never the record a lot is read from.
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
