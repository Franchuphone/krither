// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/// @notice On-chain provenance: lots, their items and their lifecycle.
interface IKritherRegistry {
    /*//////////////////////////////////////////////////////////////
                                  TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice A batch of items minted in one go.
    /// @param producer Wallet that minted the lot, never rewritten.
    /// @param itemCount Number of items the lot holds.
    /// @param cid Metadata directory CID, frozen at mint.
    struct Lot {
        address producer;
        uint96 itemCount;
        string cid;
    }

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a producer mints a lot.
    /// @param idLot Identifier of the created lot.
    /// @param idProducer Stable id of the producer, survives a wallet rotation.
    /// @param addrProducer Wallet that signed the mint.
    /// @param ref Producer's own identifier for the lot.
    /// @param cid Metadata directory CID.
    /// @param quantities Units minted for each item, in directory order.
    /// @param createdAt Block timestamp of the mint.
    event LotCreated(
        uint256 indexed idLot,
        uint256 indexed idProducer,
        address indexed addrProducer,
        uint256 ref,
        string cid,
        uint256[] quantities,
        uint256 createdAt
    );

    /// @notice Emitted when a holder records a lifecycle step against an item.
    /// @param idItem Packed item id the step was recorded against.
    /// @param idLot Lot the item belongs to.
    /// @param quantity Units the caller held when recording it.
    /// @param owner Wallet that recorded the step.
    /// @param cid Metadata CID describing the step.
    /// @param changedAt Block timestamp of the step.
    event LifecycleChanged(
        uint256 indexed idItem,
        uint256 indexed idLot,
        uint256 quantity,
        address indexed owner,
        string cid,
        uint256 changedAt
    );

    /// @notice Emitted when an alternative storage pointer is anchored.
    /// @param idLot Lot the pointer belongs to.
    /// @param serviceKey `keccak256` of the service name, for filtering.
    /// @param service Storage service the pointer reads on.
    /// @param pointer Address of the copy on that service.
    /// @param addedAt Block timestamp of the anchoring.
    event LocatorAdded(
        uint256 indexed idLot,
        bytes32 indexed serviceKey,
        string service,
        string pointer,
        uint256 addedAt
    );

    /*//////////////////////////////////////////////////////////////
                                  READS
    //////////////////////////////////////////////////////////////*/

    /// @notice Producer, item count and metadata directory CID of a lot.
    /// @param idLot Lot to look up.
    /// @return producer Wallet that minted it.
    /// @return itemCount Number of items it holds.
    /// @return cid Metadata directory CID.
    function lots(
        uint256 idLot
    )
        external
        view
        returns (address producer, uint96 itemCount, string memory cid);

    /// @notice Krither lot id a producer's own reference points to.
    /// @param idProducer Stable id of the producer.
    /// @param ref Producer's own identifier for the lot.
    /// @return idLot Lot the reference points to, zero if unused.
    function lotIds(
        uint256 idProducer,
        uint256 ref
    ) external view returns (uint256 idLot);

    /// @notice Number of lifecycle steps recorded against an item.
    /// @param idItem Packed item id to look up.
    /// @return Steps recorded so far.
    function lifecycleChanges(uint256 idItem) external view returns (uint256);

    /// @notice Lists every token id minted under a lot.
    /// @param idLot Lot to enumerate.
    /// @return ids Packed item ids, in directory order.
    function itemsOf(
        uint256 idLot
    ) external view returns (uint256[] memory ids);

    /*//////////////////////////////////////////////////////////////
                                  WRITES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mints a lot as a single batch, one token id per item.
    /// @param quantities Units minted for each item, in directory order.
    /// @param cid Metadata directory CID holding one `<index>.json` per item.
    /// @param ref Producer's own identifier for the lot, unique to them.
    /// @return idLot Identifier of the created lot.
    function mintLot(
        uint256[] calldata quantities,
        string calldata cid,
        uint256 ref
    ) external returns (uint256 idLot);

    /// @notice Records a lifecycle step against one item of a lot.
    /// @param idItem Packed item id the caller holds units of.
    /// @param cid Metadata CID describing the step.
    function addLifecycleChange(
        uint256 idItem,
        string calldata cid
    ) external;

    /// @notice Anchors an alternative storage pointer for a lot.
    /// @param idLot Lot the pointer belongs to.
    /// @param service Storage service the pointer reads on.
    /// @param pointer Address of the copy on that service.
    function addLocator(
        uint256 idLot,
        string calldata service,
        string calldata pointer
    ) external;
}
