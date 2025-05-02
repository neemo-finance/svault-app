 // SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title INeemoYieldAgent Interface
 * @author Neemo.
 */
interface INeemoYieldAgent {
    /// @notice Thrown when authentication fails.
    error AuthenticationFailed();

    /// @notice Thrown when an input parameter is invalid.
    error InvalidInput();


    event LogDeposit(
        address indexed _user,
        address indexed _token,
        uint256 _amount,
        uint256 _usdcAmount
    );

    event LogRebalance(
        address indexed _user,
        uint256 _newProtocolId,
        uint256 _amount,
        uint256 _apy
    );

    event LogWithdraw(
        address indexed _user,
        uint256 _amount
    );

    event LogRescueTokens(
        address indexed _caller,
        uint256 indexed _protocolId,
        uint256 _amount
    );

    /// @notice Deposits tokens into the yield agent.
    function deposit(address _token, uint256 _amount) external;

    /// @notice Withdraws USDC equivalent to user's share
    function withdraw(uint256 _shareAmount) external;

    /// @notice Rebalances entire pool into a new protocol.
    function rebalance(uint256 _newProtocolId, uint256 _apy) external;

    /// @notice Rescue tokens from the underlying protocol.
    function rescueTokens() external;

    /// @notice Returns the current deposit value of a user based on their share
    function getUserDepositValue(address user) external view returns (uint256, uint256);

    /// @notice Returns current protocol and TVL
    function getCurrentPosition() external view returns (uint256, uint256, uint256);
}