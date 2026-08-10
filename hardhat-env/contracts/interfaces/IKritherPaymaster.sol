// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

interface IKritherPaymaster {
    event MaxCostPerOpSet(uint256 maxCostPerOp);

    event RevenueWithdrawn(address indexed to, uint256 amount);

    /// @notice Caps what the paymaster will pay for a single operation.
    function setMaxCostPerOp(uint256 newMaxCostPerOp) external;

    /// @notice Gas budget the paymaster holds at the EntryPoint.
    function entryPointBalance() external view returns (uint256);

    /// @notice Moves subscription revenue into the EntryPoint gas budget.
    function depositToEntryPoint(uint256 amount) external;

    function withdrawFromEntryPoint(
        address payable to,
        uint256 amount
    ) external;

    /// @notice Stakes the paymaster, which bundlers require before accepting
    ///         operations that read its storage during validation.
    function addStake(uint32 unstakeDelaySec) external payable;

    function unlockStake() external;

    function withdrawStake(address payable to) external;

    /// @notice Takes unspent subscription revenue out of the contract.
    function withdrawRevenue(address payable to, uint256 amount) external;
}
