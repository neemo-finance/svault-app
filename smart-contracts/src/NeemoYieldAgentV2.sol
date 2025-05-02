// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ISakeL2Pool.sol";
import "./interfaces/IAccessController.sol";
import "./interfaces/INeemoYieldAgent.sol";
import "./interfaces/IUntitledBank.sol";
import "./interfaces/ISwapRouter.sol";
import "./libs/Roles.sol";

contract NeemoYieldAgentV2 is INeemoYieldAgent {
    using SafeERC20 for IERC20;

    //--------------------------------- Constants --------------------------------//
    uint256 public constant SAKE_PROTOCOL_ID = 1;
    uint256 public constant UNTITLED_BANK_PROTOCOL_ID = 2;

    address public constant KYO_ROUTER_ADDRESS =
        0x0dC73Fe1341365929Ed8a89Dd47097A9FDD254D0;
    address public constant SAKE_POOL_ADDRESS =
        0x3C3987A310ee13F7B8cBBe21D97D4436ba5E4B5f;
    address public constant SAKE_ATOKEN_ADDRESS =
        0x4491B60c8fdD668FcC2C4dcADf9012b3fA71a726;
    address public constant UNTITLED_POOL_ADDRESS =
        0xc675BB95D73CA7db2C09c3dC04dAaA7944CCBA41;
    address public constant USDC_ADDRESS =
        0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369;
    address public constant USDT_ADDRESS =
        0x3A337a6adA9d885b6Ad95ec48F9b75f197b5AE35;

    //--------------------------------- State Variables --------------------------------//
    IAccessController public accessController;
    uint256 internal currentProtocolId;
    uint256 internal totalShares;
    uint256 internal currentProtocolAPY;

    //-------------------------------- Mappings --------------------------------//
    mapping(address => uint256) internal userOriginalDeposit;
    mapping(address => uint256) internal userShares;

    //--------------------------------- Modifiers --------------------------------//
    modifier onlyEntityRole(bytes32 _role) {
        _onlyEntityRole(_role, msg.sender);
        _;
    }

    //--------------------------------- Constructor --------------------------------//
    constructor(address _accessController, uint256 _initProtocolId) {
        if (
            _initProtocolId != SAKE_PROTOCOL_ID &&
            _initProtocolId != UNTITLED_BANK_PROTOCOL_ID
        ) revert InvalidInput();
        if (_accessController == address(0)) revert InvalidInput();

        currentProtocolId = _initProtocolId;
        accessController = IAccessController(_accessController);
        currentProtocolAPY = 185;
    }

    //--------------------------------- External Functions --------------------------------//

    /**
     * @notice Deposit USDC or USDT to the yield agent. USDT is swapped to USDC before deposit.
     * @param _token The token being deposited (must be USDC or USDT)
     * @param _amount Amount of tokens being deposited
     */
    function deposit(address _token, uint256 _amount) external {
        if (
            _amount == 0 || (_token != USDC_ADDRESS && _token != USDT_ADDRESS)
        ) {
            revert InvalidInput();
        }

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Swap USDT to USDC
        uint256 finalAmount = _token == USDT_ADDRESS
            ? _swapToUSDC(_amount)
            : _amount;

        (, uint256 totalDepositedAmount, ) = getCurrentPosition();

        // Calculate shares
        uint256 sharesToMint = (totalShares == 0 || totalDepositedAmount == 0)
            ? finalAmount
            : (finalAmount * totalShares) / totalDepositedAmount;

        userShares[msg.sender] += sharesToMint;
        totalShares += sharesToMint;
        userOriginalDeposit[msg.sender] += finalAmount;

        _depositInProtocol(currentProtocolId, finalAmount);

        emit LogDeposit(msg.sender, _token, _amount, finalAmount);
    }

    /**
     * @notice Withdraws USDC equivalent to user's share
     * @param _amount Amount of usdc to withdraw
     */
    function withdraw(uint256 _amount) external {
        if (_amount == 0) revert InvalidInput();

        (, uint256 totalDepositedAmount, ) = getCurrentPosition();

        // Calculate how many shares the user must redeem to get `_amount`
        uint256 sharesToRedeem = (_amount * totalShares) / totalDepositedAmount;
        uint256 userShare = userShares[msg.sender];

        // Safety check: due to rounding, ensure we don’t ask for more than user has
        if (sharesToRedeem == 0 || sharesToRedeem > userShare)
            revert InvalidInput();

        userShares[msg.sender] -= sharesToRedeem;
        totalShares -= sharesToRedeem;
        userOriginalDeposit[msg.sender] -= _amount;

        uint256 currentBalance = IERC20(USDC_ADDRESS).balanceOf(address(this));

        if (currentBalance < _amount) {
            _withdrawFromProtocol(currentProtocolId, _amount - currentBalance);
        }

        IERC20(USDC_ADDRESS).safeTransfer(msg.sender, _amount);
        emit LogWithdraw(msg.sender, _amount);
    }

    /**
     * @notice Rebalances entire pool into a new protocol
     * @param _newProtocolId New protocol to rebalance into
     */
    function rebalance(
        uint256 _newProtocolId,
        uint256 _apy
    ) external onlyEntityRole(Roles.REBALANCER_ROLE) {
        if (
            _newProtocolId != SAKE_PROTOCOL_ID &&
            _newProtocolId != UNTITLED_BANK_PROTOCOL_ID
        ) revert InvalidInput();

        if (_newProtocolId == currentProtocolId || _apy == 0)
            revert InvalidInput();

        (, uint256 amount, ) = getCurrentPosition();

        _withdrawFromProtocol(currentProtocolId, amount);

        uint256 rebalanceAmount = IERC20(USDC_ADDRESS).balanceOf(address(this));
        _depositInProtocol(_newProtocolId, rebalanceAmount);

        currentProtocolId = _newProtocolId;
        currentProtocolAPY = _apy;

        emit LogRebalance(
            msg.sender,
            _newProtocolId,
            rebalanceAmount,
            currentProtocolAPY
        );
    }

    /**
     * @notice Rescue tokens from the underlying protocol.
     */
    function rescueTokens() external onlyEntityRole(Roles.TIMELOCK_ROLE) {
        (uint256 protocolId, uint256 amount, ) = getCurrentPosition();
        _withdrawFromProtocol(protocolId, amount);

        emit LogRescueTokens(msg.sender, protocolId, amount);
    }

    /**
     * @notice Returns the current deposit value of a user based on their share
     */
    function getUserDepositValue(address user) external view returns (uint256, uint256) {
        if (totalShares == 0 || userShares[user] == 0) return (0, 0);

        (, uint256 totalDepositedAmount, ) = getCurrentPosition();
        return (((userShares[user] * totalDepositedAmount) / totalShares), userOriginalDeposit[user]);
    }

    /**
     * @notice Returns current protocol and TVL
     */
    function getCurrentPosition()
        public
        view
        returns (uint256, uint256, uint256)
    {
        if (currentProtocolId == SAKE_PROTOCOL_ID) {
            uint256 aTokenBalance = IERC20(SAKE_ATOKEN_ADDRESS).balanceOf(
                address(this)
            );
            return (currentProtocolId, aTokenBalance, currentProtocolAPY);
        } else {
            uint256 uShares = IUntitledBank(UNTITLED_POOL_ADDRESS).balanceOf(
                address(this)
            );
            uint256 totalAssets = IUntitledBank(UNTITLED_POOL_ADDRESS)
                .convertToAssets(uShares);
            return (currentProtocolId, totalAssets, currentProtocolAPY);
        }
    }

    //--------------------------------- Internal Functions --------------------------------//

    /**
     * @notice Swaps USDT to USDC using Uniswap V3 router
     */
    function _swapToUSDC(uint256 _amountIn) internal returns (uint256) {
        ISwapRouter swapRouter = ISwapRouter(KYO_ROUTER_ADDRESS);
        IERC20(USDT_ADDRESS).approve(KYO_ROUTER_ADDRESS, _amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: USDT_ADDRESS,
                tokenOut: USDC_ADDRESS,
                fee: 100, // 0.01% fee tier; adjust to 500 or 3000 if required
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: 0, // Should ideally be slippage-protected
                sqrtPriceLimitX96: 0
            });

        return swapRouter.exactInputSingle(params);
    }

    /**
     * @notice Internal function to deposit USDC into the selected protocol
     */
    function _depositInProtocol(uint256 _protocolId, uint256 _amount) internal {
        if (_protocolId == SAKE_PROTOCOL_ID) {
            IERC20(USDC_ADDRESS).approve(SAKE_POOL_ADDRESS, _amount);
            ISakeL2Pool(SAKE_POOL_ADDRESS).supply(
                USDC_ADDRESS,
                _amount,
                address(this),
                0
            );
        } else if (_protocolId == UNTITLED_BANK_PROTOCOL_ID) {
            IERC20(USDC_ADDRESS).approve(UNTITLED_POOL_ADDRESS, _amount);
            IUntitledBank(UNTITLED_POOL_ADDRESS).deposit(
                _amount,
                address(this)
            );
        }
    }

    /**
     * @notice Internal function to withdraw USDC from the selected protocol
     */
    function _withdrawFromProtocol(
        uint256 _protocolId,
        uint256 _amount
    ) internal {
        if (_protocolId == SAKE_PROTOCOL_ID) {
            ISakeL2Pool(SAKE_POOL_ADDRESS).withdraw(
                USDC_ADDRESS,
                _amount,
                address(this)
            );
        } else if (_protocolId == UNTITLED_BANK_PROTOCOL_ID) {
            IUntitledBank bank = IUntitledBank(UNTITLED_POOL_ADDRESS);
            uint256 shares = bank.convertToShares(_amount);

            bank.redeem(shares, address(this), address(this));
        }
    }

    /**
     * @notice Ensures a caller has the proper role from the access controller
     */
    function _onlyEntityRole(bytes32 _role, address _user) internal view {
        if (!accessController.ensureEntityRole(_role, _user))
            revert AuthenticationFailed();
    }
}
