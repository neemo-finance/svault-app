// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IUntitledBank {
    
    function deposit(uint256 assets, address receiver) external returns (uint256);

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function convertToAssets(uint256 shares) external view returns (uint256);

    function convertToShares(uint256 assets) external view returns (uint256);
}
