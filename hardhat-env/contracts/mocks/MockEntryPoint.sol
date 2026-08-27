// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {
    IPaymaster
} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import {
    PackedUserOperation
} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/// @notice Stand-in EntryPoint driving the paymaster's two hooks directly.
/// @dev The real EntryPoint wraps a rejected validation in
///      `FailedOpWithRevert`, which buries the reason the paymaster refused.
///      Calling through this mock lets a test assert on the custom error
///      itself, and reach states no bundler would produce.
contract MockEntryPoint {
    /*//////////////////////////////////////////////////////////////
                                 DEPOSITS
    //////////////////////////////////////////////////////////////*/

    /// @notice Gas budget an account holds here.
    mapping(address account => uint256 balance) public balanceOf;

    /// @notice Context the last validation returned.
    bytes public lastContext;

    /// @notice Validation data the last validation returned.
    uint256 public lastValidationData;

    receive() external payable {}

    /// @notice Credits an account's budget with what the call carries.
    /// @param account Account to credit.
    function depositTo(address account) external payable {
        balanceOf[account] += msg.value;
    }

    /*//////////////////////////////////////////////////////////////
                             PAYMASTER HOOKS
    //////////////////////////////////////////////////////////////*/

    /// @notice Runs validation alone, keeping what the paymaster returned.
    /// @param paymaster Paymaster to drive.
    /// @param userOp Operation to validate.
    /// @param userOpHash Hash the paymaster is handed.
    /// @param maxCost Ceiling the operation is validated against.
    function validate(
        address paymaster,
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external {
        (bytes memory context, uint256 validationData) = IPaymaster(paymaster)
            .validatePaymasterUserOp(userOp, userOpHash, maxCost);
        lastContext = context;
        lastValidationData = validationData;
    }

    /// @notice Settles an operation with a context of the caller's choosing.
    /// @param paymaster Paymaster to drive.
    /// @param mode Outcome the operation is settled with.
    /// @param context Context handed back to the paymaster.
    /// @param actualGasCost Wei the operation is booked as having cost.
    /// @param actualUserOpFeePerGas Fee per gas the operation ran at.
    function settle(
        address paymaster,
        IPaymaster.PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external {
        IPaymaster(paymaster).postOp(
            mode,
            context,
            actualGasCost,
            actualUserOpFeePerGas
        );
    }

    /// @notice Validation then settlement, the pair the EntryPoint always runs
    ///         together, carrying the context between them.
    /// @param paymaster Paymaster to drive.
    /// @param userOp Operation to sponsor.
    /// @param userOpHash Hash the paymaster is handed.
    /// @param maxCost Ceiling the operation is validated against.
    /// @param mode Outcome the operation is settled with.
    /// @param actualGasCost Wei the operation is booked as having cost.
    function sponsor(
        address paymaster,
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost,
        IPaymaster.PostOpMode mode,
        uint256 actualGasCost
    ) external {
        (bytes memory context, uint256 validationData) = IPaymaster(paymaster)
            .validatePaymasterUserOp(userOp, userOpHash, maxCost);
        lastContext = context;
        lastValidationData = validationData;
        if (context.length != 0) {
            IPaymaster(paymaster).postOp(mode, context, actualGasCost, 1);
        }
    }
}
