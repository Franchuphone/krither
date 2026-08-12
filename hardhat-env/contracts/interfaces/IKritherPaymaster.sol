// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.31;

import {
    IEntryPoint
} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

interface IKritherPaymaster {
    /// @notice One leg of a batch a reference ERC-4337 account forwards.
    struct AccountCall {
        address target;
        uint256 value;
        bytes data;
    }

    event MaxCostPerOpSet(uint256 maxCostPerOp);

    event SponsoredTargetSet(address indexed target, bool allowed);

    event OperationSponsored(
        address indexed account,
        uint256 actualGasCost,
        uint32 remaining
    );

    event OnboardingSponsored(address indexed account, uint256 actualGasCost);

    event RevenueWithdrawn(address indexed to, uint256 amount);

    /// @notice EntryPoint the paymaster answers to.
    function entryPoint() external view returns (IEntryPoint);

    /// @notice Ceiling on what a single operation may cost the paymaster.
    /// @dev Zero until the admin sets it, so a freshly deployed paymaster
    ///      sponsors nothing.
    function maxCostPerOp() external view returns (uint256);

    /// @notice Caps what the paymaster will pay for a single operation.
    function setMaxCostPerOp(uint256 newMaxCostPerOp) external;

    /// @notice Whether operations calling `target` may be sponsored.
    function sponsoredTargets(address target) external view returns (bool);

    /// @notice Opens or closes a contract to sponsorship.
    /// @dev Krither pays for Krither: the registry and the paymaster itself
    ///      are open from construction, anything else is a deliberate act.
    function setSponsoredTarget(address target, bool allowed) external;

    /// @notice Whether an account has spent the one operation it gets before
    ///         holding a subscription.
    function onboardingUsed(address account) external view returns (bool);

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
