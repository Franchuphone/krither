// SPDX-License-Identifier: UNLICENSED
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
    mapping(address => uint256) public balanceOf;

    bytes public lastContext;

    uint256 public lastValidationData;

    receive() external payable {}

    function depositTo(address account) external payable {
        balanceOf[account] += msg.value;
    }

    /// @notice Runs validation alone, keeping what the paymaster returned.
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
