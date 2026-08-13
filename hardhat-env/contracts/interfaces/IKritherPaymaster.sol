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

    event OnboardingFailed(
        address indexed account,
        uint256 actualGasCost,
        uint256 remainingFreeOps
    );

    event FreeOpsReset(address indexed account);

    /// @notice Money entering the gas budget or the stake, naming which.
    /// @param amountSent Advanced by the caller with the call.
    /// @param amountHeld Taken from the subscription revenue the contract holds.
    /// @dev The two are split because they are not the same money: one is an
    ///      operator putting funds in, the other Krither spending what it
    ///      earned. `amountSent` above what moved is a caller that sent more
    ///      than it deposited, the surplus staying in the contract as revenue.
    /// @dev Revenue arriving needs nothing here: `Subscribed` already marks
    ///      every payment in.
    event FundsDeposited(
        string to,
        address indexed from,
        uint256 amountSent,
        uint256 amountHeld
    );

    /// @notice Money leaving Krither, naming the pot it came out of.
    /// @dev The EntryPoint logs its own withdrawals, but at its own address and
    ///      for every paymaster on the chain at once. Re-emitting here keeps
    ///      the three movements one stream, read from one contract.
    event FundsWithdrawn(string from, address indexed to, uint256 amount);

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

    /// @notice Operations an account has had sponsored while holding no
    ///         subscription without any of them buying one.
    /// @dev Reset the moment a purchase lands, so renewing costs an account
    ///      nothing and only wasted attempts accumulate.
    function freeOps(address account) external view returns (uint256);

    /// @notice Hands an account the free operations it has spent back.
    /// @dev The counter is what bounds the gas an account can spend without
    ///      paying, so clearing it is deliberate: it is for an account whose
    ///      attempts failed on Krither rather than on itself.
    function resetFreeOps(address account) external;

    /// @notice Gas budget the paymaster holds at the EntryPoint.
    function entryPointBalance() external view returns (uint256);

    /// @notice Funds the EntryPoint gas budget, out of what the caller sends,
    ///         out of subscription revenue, or out of both.
    function depositToEntryPoint(uint256 amount) external payable;

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
