// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

interface IKritherRegistry {
    struct Lot {
        address producer;
        uint96 itemCount;
        string cid;
    }

    event LotCreated(
        uint256 indexed idLot,
        address indexed producer,
        uint256 indexed ref,
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

    event LocatorAdded(
        uint256 indexed idLot,
        bytes32 indexed serviceKey,
        string service,
        string pointer,
        uint256 addedAt
    );

    /// @notice Producer, item count and metadata directory CID of a lot.
    function lots(
        uint256 idLot
    )
        external
        view
        returns (address producer, uint96 itemCount, string memory cid);

    /// @notice Krither lot id a producer's own reference points to.
    function lotIds(
        address producer,
        uint256 ref
    ) external view returns (uint256 idLot);

    /// @notice Number of lifecycle steps recorded against an item.
    function lifecycleChanges(uint256 idItem) external view returns (uint256);

    /// @notice Lists every token id minted under a lot.
    function itemsOf(
        uint256 idLot
    ) external view returns (uint256[] memory ids);

    /// @notice Mints a lot as a single batch, one token id per item.
    function mintLot(
        uint256[] calldata quantities,
        string calldata cid,
        uint256 ref
    ) external returns (uint256 idLot);

    /// @notice Records a lifecycle step against one item of a lot.
    function addLifecycleChange(
        uint256 idItem,
        string calldata cid
    ) external;

    /// @notice Anchors an alternative storage pointer for a lot.
    function addLocator(
        uint256 idLot,
        string calldata service,
        string calldata pointer
    ) external;
}
