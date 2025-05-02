// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Timelock.
 * @notice Implementation of OpenZeppelin's TimelockController for Neemo.
 * @author neemo.
 */
contract Timelock is TimelockController {
    /// @notice Constructor to initialize the NeemoTimelock.
    /// @param _minDelay Minimum delay required before execution of a proposal.
    /// @param _proposers Addresses allowed to propose actions for execution.
    /// @param _executors Addresses allowed to execute proposed actions.
    /// @param _admin Address with administrative powers over the timelock.
    constructor(
        uint256 _minDelay,
        address[] memory _proposers,
        address[] memory _executors,
        address _admin
    ) TimelockController(_minDelay, _proposers, _executors, _admin) {}
}
