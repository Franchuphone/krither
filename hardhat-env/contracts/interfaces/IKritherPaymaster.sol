// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {
    IEntryPoint
} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/// @notice Sponsorship terms, gas budget and stake of the Krither paymaster.
interface IKritherPaymaster {
    /*//////////////////////////////////////////////////////////////
                                  TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice One leg of a batch a reference ERC-4337 account forwards.
    /// @param target Contract the leg calls.
    /// @param value Native currency it carries.
    /// @param data Call data it forwards.
    struct AccountCall {
        address target;
        uint256 value;
        bytes data;
    }

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the per-operation ceiling is set.
    /// @param maxCostPerOp New ceiling, in wei.
    event MaxCostPerOpSet(uint256 maxCostPerOp);

    /// @notice Emitted when a contract is opened or closed to sponsorship.
    /// @param target Contract the change applies to.
    /// @param allowed Whether operations calling it may be sponsored.
    event SponsoredTargetSet(address indexed target, bool allowed);

    /// @notice Emitted when an operation is settled against a subscription.
    /// @param account Wallet the operation belongs to.
    /// @param actualGasCost Wei the paymaster advanced.
    /// @param remaining Transactions left in the window in progress.
    event OperationSponsored(
        address indexed account,
        uint256 actualGasCost,
        uint32 remaining
    );

    /// @notice Emitted when a sponsored attempt bought a plan.
    /// @param account Wallet that bought it.
    /// @param actualGasCost Wei the paymaster advanced.
    event OnboardingSponsored(address indexed account, uint256 actualGasCost);

    /// @notice Emitted when a sponsored attempt bought nothing.
    /// @param account Wallet the attempt belongs to.
    /// @param actualGasCost Wei the paymaster advanced.
    /// @param remainingFreeOps Free operations the account has left.
    event OnboardingFailed(
        address indexed account,
        uint256 actualGasCost,
        uint256 remainingFreeOps
    );

    /// @notice Emitted when an account's free operations are handed back.
    /// @param account Wallet the counter was cleared for.
    event FreeOpsReset(address indexed account);

    /// @notice Money entering the gas budget or the stake, naming which.
    /// @dev The two figures are not the same money: one is an operator putting
    ///      funds in, the other Krither spending what it earned.
    /// @param to Pot the money went into, `deposit` or `stake`.
    /// @param from Caller that moved it.
    /// @param amountSent Advanced by the caller with the call.
    /// @param amountHeld Taken from the subscription revenue the contract holds.
    event FundsDeposited(
        string to,
        address indexed from,
        uint256 amountSent,
        uint256 amountHeld
    );

    /// @notice Money leaving Krither, naming the pot it came out of.
    /// @dev The EntryPoint logs its own withdrawals, but for every paymaster
    ///      on the chain at once; re-emitting keeps the movements one stream.
    /// @param from Pot the money came out of.
    /// @param to Wallet it was sent to.
    /// @param amount Wei sent.
    event FundsWithdrawn(string from, address indexed to, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                  READS
    //////////////////////////////////////////////////////////////*/

    /// @notice EntryPoint the paymaster answers to.
    /// @return The EntryPoint.
    function entryPoint() external view returns (IEntryPoint);

    /// @notice Ceiling on what a single operation may cost the paymaster.
    /// @dev Zero until the admin sets it, so a freshly deployed paymaster
    ///      sponsors nothing.
    /// @return Ceiling, in wei.
    function maxCostPerOp() external view returns (uint256);

    /// @notice Whether operations calling `target` may be sponsored.
    /// @param target Contract to look up.
    /// @return Whether it is open to sponsorship.
    function sponsoredTargets(address target) external view returns (bool);

    /// @notice Operations an account has had sponsored while holding no
    ///         subscription without any of them buying one.
    /// @dev Reset the moment a purchase lands, so renewing costs an account
    ///      nothing and only wasted attempts accumulate.
    /// @param account Wallet to look up.
    /// @return Free operations spent so far.
    function freeOps(address account) external view returns (uint256);

    /// @notice Gas budget the paymaster holds at the EntryPoint.
    /// @return Budget, in wei.
    function entryPointBalance() external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                           SPONSORSHIP TERMS
    //////////////////////////////////////////////////////////////*/

    /// @notice Caps what the paymaster will pay for a single operation.
    /// @param newMaxCostPerOp New ceiling, in wei.
    function setMaxCostPerOp(uint256 newMaxCostPerOp) external;

    /// @notice Opens or closes a contract to sponsorship.
    /// @dev Krither pays for Krither: the registry and the paymaster itself
    ///      are open from construction, anything else is a deliberate act.
    /// @param target Contract to open or close.
    /// @param allowed Whether operations calling it may be sponsored.
    function setSponsoredTarget(address target, bool allowed) external;

    /// @notice Hands an account the free operations it has spent back.
    /// @dev The counter bounds the gas an account can spend without paying,
    ///      so clearing it is for attempts that failed on Krither's side.
    /// @param account Wallet to clear the counter for.
    function resetFreeOps(address account) external;

    /*//////////////////////////////////////////////////////////////
                          GAS BUDGET AND STAKE
    //////////////////////////////////////////////////////////////*/

    /// @notice Funds the EntryPoint gas budget, out of what the caller sends,
    ///         out of subscription revenue, or out of both.
    /// @param amount Wei sent on to the EntryPoint.
    function depositToEntryPoint(uint256 amount) external payable;

    /// @notice Takes part of the gas budget back out to a wallet.
    /// @param to Wallet receiving it.
    /// @param amount Wei to withdraw.
    function withdrawFromEntryPoint(
        address payable to,
        uint256 amount
    ) external;

    /// @notice Stakes the paymaster, which bundlers require before accepting
    ///         operations that read its storage during validation.
    /// @param unstakeDelaySec Delay the stake stays locked for.
    function addStake(uint32 unstakeDelaySec) external payable;

    /// @notice Starts the unstaking delay.
    function unlockStake() external;

    /// @notice Takes the unlocked stake out to a wallet.
    /// @param to Wallet receiving it.
    function withdrawStake(address payable to) external;

    /// @notice Takes unspent subscription revenue out of the contract.
    /// @param to Wallet receiving it.
    /// @param amount Wei to withdraw.
    function withdrawRevenue(address payable to, uint256 amount) external;
}
