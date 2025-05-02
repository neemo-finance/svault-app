// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title Roles.
 * @notice Library defining role constants for access control.
 * @author neemo.
 */
library Roles {
    /// @notice Role identifier for timelock contract.
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK_ROLE");

    /// @notice Role identifier for Rebalancer agent.
    bytes32 public constant REBALANCER_ROLE = keccak256("REBALANCER_ROLE");

}
