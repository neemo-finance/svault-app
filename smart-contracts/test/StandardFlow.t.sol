// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/AccessController.sol";
import "../src/NeemoYieldAgentV2.sol";
import "../src/Timelock.sol";

contract StandardFlow is Test {

    Timelock public timeLock;
    NeemoYieldAgentV2 public neemoYieldAgent;
    AccessController public accessController;
    address admin;
    address user1;
    address user2;
    address rebalancer;
    address[] proposers;
    address[] executors;

    address public constant USDC_ADDRESS = 0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369;
    address public constant USDT_ADDRESS = 0x3A337a6adA9d885b6Ad95ec48F9b75f197b5AE35;

    function setUp() public {
        admin = address(uint160(uint(keccak256(abi.encodePacked("admin")))));
        rebalancer = address(uint160(uint(keccak256(abi.encodePacked("rebalancer")))));
        proposers.push(address(uint160(uint(keccak256(abi.encodePacked("proposer"))))));
        executors.push(address(uint160(uint(keccak256(abi.encodePacked("executor"))))));
        user1 = address(uint160(uint(keccak256(abi.encodePacked("user1")))));
        user2 = address(uint160(uint(keccak256(abi.encodePacked("user2")))));

        // TimeLock
        timeLock = new Timelock(100, proposers, executors, admin);

        // AccessController
        accessController = new AccessController(uint48(100), admin);

        IAccessController.InitRoleSetter memory accessRolesInit = IAccessController.InitRoleSetter({
            timelock: address(timeLock),
            rebalancer: rebalancer
        });

        vm.prank(admin);
        accessController.initNeemoRoles(accessRolesInit);

        neemoYieldAgent = new NeemoYieldAgentV2(address(accessController), 1);
    }

    function testDeposit() public {
        uint256 usdcAmount = 1000000000;
        deal(USDC_ADDRESS, user1, usdcAmount);
        deal(USDC_ADDRESS, user2, usdcAmount);

        // pre check 
        assertEq(IERC20(USDC_ADDRESS).balanceOf(user1), usdcAmount);
        assertEq(IERC20(USDC_ADDRESS).balanceOf(user2), usdcAmount);
        (uint256 userDepositValue,) = neemoYieldAgent.getUserDepositValue(user1);
        assertEq(userDepositValue, 0);


        // deposit 
        vm.startPrank(user1);
        IERC20(USDC_ADDRESS).approve(address(neemoYieldAgent), usdcAmount);

        neemoYieldAgent.deposit(USDC_ADDRESS, usdcAmount);
        vm.stopPrank();

        // post deposit check
        assertEq(IERC20(USDC_ADDRESS).balanceOf(user1), 0);
        ( userDepositValue,) = neemoYieldAgent.getUserDepositValue(user1);
        assertEq(userDepositValue, usdcAmount);

        // (uint256 currentProtocolId, uint256 totalAssets, ) = neemoYieldAgent.getCurrentPosition();
        // console.log(currentProtocolId, totalAssets, neemoYieldAgent.getUserDepositValue(user1));

        // deposit user2'
        vm.startPrank(user2);
        IERC20(USDC_ADDRESS).approve(address(neemoYieldAgent), usdcAmount);

        neemoYieldAgent.deposit(USDC_ADDRESS, usdcAmount);
        vm.stopPrank();

        // post deposit check
        assertEq(IERC20(USDC_ADDRESS).balanceOf(user2), 0);
        ( userDepositValue,) = neemoYieldAgent.getUserDepositValue(user2);
        assertLt(userDepositValue, usdcAmount);
    }

    function testSwapDeposit() public {
        uint256 amount = 1000000000;

        deal(USDT_ADDRESS, user1, amount);

        // deposit 
        vm.startPrank(user1);
        IERC20(USDT_ADDRESS).approve(address(neemoYieldAgent), amount);

        neemoYieldAgent.deposit(USDT_ADDRESS, amount);
        vm.stopPrank();

        // post deposit check
        assertEq(IERC20(USDT_ADDRESS).balanceOf(user1), 0);
        (uint256 userDepositValue,) = neemoYieldAgent.getUserDepositValue(user1);
        assertLt(userDepositValue, amount);

        // (uint256 currentProtocolId, uint256 totalAssets, ) = neemoYieldAgent.getCurrentPosition();
        // console.log(currentProtocolId, totalAssets, neemoYieldAgent.getUserDepositValue(user1));
    }

    function testWithdraw() public {
        uint256 usdcAmount = 1000000000;
        deal(USDC_ADDRESS, user1, usdcAmount);

        // deposit 
        vm.startPrank(user1);
        IERC20(USDC_ADDRESS).approve(address(neemoYieldAgent), usdcAmount);

        neemoYieldAgent.deposit(USDC_ADDRESS, usdcAmount);
        vm.stopPrank();

        // post deposit check
        assertEq(IERC20(USDC_ADDRESS).balanceOf(user1), 0);
        (uint256 userDepositValue,) = neemoYieldAgent.getUserDepositValue(user1);
        assertEq(userDepositValue, usdcAmount);

        // withdraw 
        vm.startPrank(user1);
        neemoYieldAgent.withdraw(usdcAmount / 2);
        vm.stopPrank();

        // post withdraw check
        assertEq(IERC20(USDC_ADDRESS).balanceOf(user1), usdcAmount / 2);
        ( userDepositValue,) = neemoYieldAgent.getUserDepositValue(user1);
        assertLe(userDepositValue, usdcAmount / 2);

        // (uint256 currentProtocolId, uint256 totalAssets, ) = neemoYieldAgent.getCurrentPosition();
        // console.log(currentProtocolId, totalAssets, neemoYieldAgent.getUserDepositValue(user1));
    }

    function testRebalance() public {
        uint256 usdcAmount = 1000000000;
        deal(USDC_ADDRESS, user1, usdcAmount);
        deal(USDC_ADDRESS, user2, usdcAmount);


        // deposit 
        vm.startPrank(user1);
        IERC20(USDC_ADDRESS).approve(address(neemoYieldAgent), usdcAmount);

        neemoYieldAgent.deposit(USDC_ADDRESS, usdcAmount);
        vm.stopPrank();

        // deposit user2'
        vm.startPrank(user2);
        IERC20(USDC_ADDRESS).approve(address(neemoYieldAgent), usdcAmount);

        neemoYieldAgent.deposit(USDC_ADDRESS, usdcAmount);
        vm.stopPrank();

        (uint256 currentProtocolId, uint256 totalAssets, ) = neemoYieldAgent.getCurrentPosition();
        console.log(currentProtocolId, totalAssets);
        assertEq(currentProtocolId, 1);
        assertLe(totalAssets, usdcAmount * 2);

        // rebalance
        vm.startPrank(rebalancer);
        neemoYieldAgent.rebalance(2, 1);
        vm.stopPrank();
        (currentProtocolId, totalAssets, ) = neemoYieldAgent.getCurrentPosition();
        console.log(currentProtocolId, totalAssets);
        assertEq(currentProtocolId, 2);
        assertLe(totalAssets, usdcAmount * 2);

        // rebalance again
        vm.startPrank(rebalancer);
        neemoYieldAgent.rebalance(1, 1);
        vm.stopPrank();
        (currentProtocolId, totalAssets, ) = neemoYieldAgent.getCurrentPosition();
        console.log(currentProtocolId, totalAssets);

    }

}
