# NBC流动性挖矿实施指南

## 📋 概述

本指南介绍如何为NBC DEX添加流动性挖矿功能，让流动性提供者除了获得0.3%的交易手续费外，还能获得额外的NBC代币奖励。

## 🎯 方案说明

### 当前机制
- ✅ 用户提供流动性 → 获得LP代币
- ✅ 交易者交易 → 支付0.3%手续费（保留在池子中）
- ✅ LP代币价值增长（因为池子里的代币增加了）

### 新增机制（额外奖励层）
- ✅ 用户将LP代币质押到流动性挖矿合约
- ✅ 根据质押时间和数量获得NBC代币奖励
- ✅ 原有的0.3%手续费机制**不受影响**
- ✅ 用户可以随时取回LP代币

## 🏗️ 架构设计

```
用户提供流动性
    ↓
获得LP代币 (继续累积0.3%手续费)
    ↓
将LP代币质押到LiquidityMining合约
    ↓
获得NBC代币奖励 (额外收益)
    ↓
可随时取回LP代币并领取奖励
```

## 📦 合约说明

### LiquidityMining.sol

**主要功能：**
1. **质押LP代币**：用户将Uniswap LP代币质押到合约
2. **NBC奖励分发**：按区块自动计算和分发NBC奖励
3. **多池子支持**：可以为不同的LP代币设置不同的奖励权重
4. **灵活提取**：用户可随时提取LP代币和领取奖励

**关键参数：**
- `nbcPerBlock`: 每个区块分发的NBC数量
- `allocPoint`: 每个池子的分配权重
- `startBlock`: 开始分发奖励的区块
- `endBlock`: 结束分发奖励的区块

## 🚀 部署步骤

### 步骤1: 准备NBC奖励代币

首先需要有NBC代币用于奖励。有两个选择：

**选项A: 使用WNBC (Wrapped NBC)**
```bash
# WNBC地址已部署: 0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC
# 可以直接使用
```

**选项B: 部署新的NBC ERC20代币**
```solidity
// 创建一个ERC20代币作为奖励代币
// 需要单独部署
```

### 步骤2: 部署LiquidityMining合约

```bash
cd uniswap-contracts-moonbeam

# 安装依赖 (如果还没安装)
npm install @openzeppelin/contracts

# 部署合约
npx hardhat run scripts/deploy-liquidity-mining.js --network nbc
```

### 步骤3: 向合约转入NBC代币

```javascript
// 假设要分发1年的奖励
// 每个区块10 NBC，12秒一个区块
// 1年 = 365 * 24 * 60 * 60 / 12 = 2,628,000 个区块
// 总需要 = 2,628,000 * 10 = 26,280,000 NBC

const nbcToken = await ethers.getContractAt("IERC20", NBC_TOKEN_ADDRESS);
await nbcToken.transfer(LIQUIDITY_MINING_ADDRESS, ethers.utils.parseEther("26280000"));
```

### 步骤4: 添加LP池子

```javascript
const liquidityMining = await ethers.getContractAt("LiquidityMining", LIQUIDITY_MINING_ADDRESS);

// 添加 NBC/USDT LP池 (权重100)
await liquidityMining.add(
  100,                    // allocPoint (权重)
  "NBC_USDT_LP_ADDRESS",  // LP代币地址
  true                    // 是否更新所有池子
);

// 添加 NBC/BTC LP池 (权重80)
await liquidityMining.add(
  80,
  "NBC_BTC_LP_ADDRESS",
  true
);

// 添加 NBC/ETH LP池 (权重60)
await liquidityMining.add(
  60,
  "NBC_ETH_LP_ADDRESS",
  true
);
```

## 👥 用户使用流程

### 1. 提供流动性并获得LP代币

```javascript
// 用户在Uniswap界面添加流动性
// 自动获得LP代币
```

### 2. 授权LP代币给挖矿合约

```javascript
const lpToken = await ethers.getContractAt("IERC20", LP_TOKEN_ADDRESS);
await lpToken.approve(LIQUIDITY_MINING_ADDRESS, ethers.constants.MaxUint256);
```

### 3. 质押LP代币

```javascript
const liquidityMining = await ethers.getContractAt("LiquidityMining", LIQUIDITY_MINING_ADDRESS);
await liquidityMining.deposit(
  0,                                    // poolId
  ethers.utils.parseEther("100")       // 质押100个LP代币
);
```

### 4. 查看待领取奖励

```javascript
const pending = await liquidityMining.pendingNbc(0, userAddress);
console.log("待领取NBC:", ethers.utils.formatEther(pending));
```

### 5. 领取奖励

```javascript
await liquidityMining.harvest(0);  // 领取poolId=0的奖励
```

### 6. 提取LP代币

```javascript
await liquidityMining.withdraw(
  0,                                    // poolId
  ethers.utils.parseEther("50")        // 提取50个LP代币
);
```

## 💰 收益计算示例

假设：
- NBC/USDT池总质押量: 1,000,000 LP
- 您的质押量: 10,000 LP (占1%)
- 池子权重: 100 (占总权重的50%)
- 每区块奖励: 10 NBC
- 区块时间: 12秒

**您的收益：**
```
每区块收益 = 10 NBC × 50% × 1% = 0.05 NBC
每天收益 = 0.05 × (24×60×60/12) = 360 NBC
每月收益 = 360 × 30 = 10,800 NBC
年化收益 = 10,800 × 12 = 129,600 NBC
```

**加上原有的0.3%交易手续费，总收益更高！**

## 🎨 前端集成

### 添加挖矿页面

在 `uniswap-interface-moonbeam` 中添加新页面：

```typescript
// src/pages/Farm/index.tsx
import React from 'react'
import { useContract } from '../../hooks/useContract'
import LIQUIDITY_MINING_ABI from '../../constants/abis/liquidity-mining.json'

export default function Farm() {
  const liquidityMining = useContract(LIQUIDITY_MINING_ADDRESS, LIQUIDITY_MINING_ABI)
  
  // 实现质押、提取、领取奖励等功能
  // ...
}
```

### 显示APY

```typescript
// 计算年化收益率
const calculateAPY = (poolInfo: PoolInfo) => {
  const nbcPerYear = nbcPerBlock * blocksPerYear * poolInfo.allocPoint / totalAllocPoint
  const lpValueInUSD = poolInfo.totalStaked * lpTokenPrice
  const nbcValueInUSD = nbcPerYear * nbcPrice
  const apy = (nbcValueInUSD / lpValueInUSD) * 100
  return apy
}
```

## ⚠️ 重要注意事项

### 1. 安全性
- ✅ 合约使用OpenZeppelin标准库
- ✅ 包含ReentrancyGuard防止重入攻击
- ✅ 建议在主网部署前进行专业审计

### 2. 经济模型
- 📊 合理设置每区块奖励数量
- 📊 根据TVL调整奖励以维持合理APY
- 📊 考虑NBC代币的通胀率

### 3. 运营成本
- 💰 需要持续向合约充值NBC代币
- 💰 建议设置1-2年的奖励储备
- 💰 可以通过协议收入来补充奖励池

### 4. 用户体验
- 🎯 清晰显示APY和收益
- 🎯 提供一键质押功能
- 🎯 实时显示待领取奖励

## 📊 监控和管理

### 查看池子信息

```javascript
const poolInfo = await liquidityMining.poolInfo(0);
console.log("LP代币:", poolInfo.lpToken);
console.log("权重:", poolInfo.allocPoint.toString());
console.log("总质押:", ethers.utils.formatEther(poolInfo.totalStaked));
```

### 调整奖励速率

```javascript
// 降低每区块奖励
await liquidityMining.updateNbcPerBlock(ethers.utils.parseEther("5"));
```

### 调整池子权重

```javascript
// 提高某个池子的权重
await liquidityMining.set(0, 150, true);
```

## 🔄 与原有系统的关系

```
原有系统 (保持不变):
├── UniswapV2Factory
├── UniswapV2Router
├── UniswapV2Pair (0.3%手续费机制)
└── LP代币

新增系统 (额外奖励):
└── LiquidityMining
    ├── 质押LP代币
    ├── 分发NBC奖励
    └── 不影响原有手续费
```

## 📈 优势

1. **双重收益**：0.3%手续费 + NBC挖矿奖励
2. **灵活性**：可随时调整奖励参数
3. **兼容性**：不需要修改核心合约
4. **安全性**：使用成熟的MasterChef模式
5. **可扩展**：可以添加多个池子

## 🎯 总结

通过添加LiquidityMining合约，您可以：
- ✅ 保持原有的Uniswap V2机制不变
- ✅ 为流动性提供者提供额外的NBC奖励
- ✅ 吸引更多流动性
- ✅ 提高DEX的竞争力

**这是最推荐的方案！** 既不破坏原有系统，又能提供额外激励。

---

如有问题，请参考：
- [Uniswap V2 文档](https://docs.uniswap.org/protocol/V2/introduction)
- [SushiSwap MasterChef](https://github.com/sushiswap/sushiswap)
- [OpenZeppelin 合约](https://docs.openzeppelin.com/contracts/)
