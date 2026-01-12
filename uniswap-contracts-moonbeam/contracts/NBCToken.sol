// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NBCToken
 * @notice NBC奖励代币 - 用于流动性挖矿奖励
 * @dev 可增发的ERC20代币，仅owner可以铸造
 */
contract NBCToken is ERC20, Ownable {
    
    // 最大供应量 (可选，设置为0表示无上限)
    uint256 public maxSupply;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20(name, symbol) {
        maxSupply = _maxSupply;
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }
    
    /**
     * @notice 铸造新代币
     * @param to 接收地址
     * @param amount 数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (maxSupply > 0) {
            require(totalSupply() + amount <= maxSupply, "NBCToken: exceeds max supply");
        }
        _mint(to, amount);
    }
    
    /**
     * @notice 批量铸造
     * @param recipients 接收地址数组
     * @param amounts 数量数组
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "NBCToken: length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (maxSupply > 0) {
                require(totalSupply() + amounts[i] <= maxSupply, "NBCToken: exceeds max supply");
            }
            _mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @notice 销毁代币
     * @param amount 数量
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice 从指定地址销毁代币
     * @param account 地址
     * @param amount 数量
     */
    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "NBCToken: burn amount exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }
}
