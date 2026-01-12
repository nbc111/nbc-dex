# NBC DEX 项目合约地址汇总

> ⚠️ **重要提示**: 本文档中的 Router 地址存在不一致问题，请参考 [ADDRESS_VERIFICATION_REPORT.md](./ADDRESS_VERIFICATION_REPORT.md) 查看详细验证报告。

## 📋 目录
- [核心合约地址](#核心合约地址)
- [部署信息](#部署信息)
- [测试代币地址](#测试代币地址)
- [流动性挖矿相关](#流动性挖矿相关)
- [配置文件位置](#配置文件位置)

---

## 🎯 核心合约地址

### NBC 链部署的合约 (Chain ID: 1281)

| 合约名称 | 地址 | 说明 |
|---------|------|------|
| **WETH (Wrapped DEV)** | `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC` | 包装的原生代币 |
| **Factory** | `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793` | Uniswap V2 工厂合约 |
| **Router V02** ⚠️ | `0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A` | 前端使用 (nbc_address.json) |
| **Router V02** ⚠️ | `0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991` | 文档记录 (moonbase_address.json) |
| **Router V02** ⚠️ | `0x2c37f19A9963f3C829c35332662d1BDda10Fe9fC` | 合约记录 (address.json) |
| **Multicall** | `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a` | 多调用合约 |

### 重要哈希值

| 名称 | 值 | 说明 |
|------|-----|------|
| **Init Code Hash** | `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f` | STANDALONE (1281) |
| **Init Code Hash** | `0x01429e880a7972ebfbba904a5bbe32a816e78273e4b38ffa6bdeaebce8adba7c` | 其他网络 |
| **Init Code Hash (NBC)** | `0x2fe714b2a8ae1bc2f8a4181f48e8d9cb072c8ec7193ad627a77f095d2d406c02` | NBC 配置 |

---

## 👤 部署信息

### 网络配置

| 参数 | 值 |
|------|-----|
| **网络名称** | NBC Chain |
| **RPC URL** | `https://rpc.nbcex.com` |
| **Chain ID** | `1281` |
| **货币符号** | NBC |
| **部署账户** | `0x1A0370aE087A089eC5895A0744e3B750993A24a8` |

### 私钥信息（仅用于开发/测试）

⚠️ **警告：以下私钥仅用于测试环境，请勿在生产环境使用！**

| 环境 | 私钥 |
|------|------|
| **开发环境** | `0x99b3c12287537e38c90a9219d4cb074a89a16e9cdb20bf85728ebd97c343e342` |
| **NBC 部署** | `0x426231b32113022e22bfc31dc90c15561b6b32ae2dc1d8f0bfaf39c638664a8f` |

---

## 🪙 测试代币地址

### Moonbase Alpha 测试网代币

| 代币 | 地址 | 说明 |
|------|------|------|
| **ERTH** | `0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac` | Earth Token |
| **MARS** | `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3` | Mars Token |
| **JUPI** | `0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81` | Jupiter Token |
| **SATU** | `0x9C43237490272BfdD2F1d1ca0B34f20b1A3C9f5c` | Saturn Token |
| **MERC** | `0x48e1772534fabBdcaDe9ca4005E5Ee8BF4190093` | Mercury Token |
| **VENU** | `0x8d22041C22d696fdfF0703852a706a40Ff65a7de` | Venus Token |
| **NEPT** | `0x8cEb9a93405CDdf3D76f72327F868Bd3E8755D89` | Neptune Token |
| **URAN** | `0xd365877026A43107Efd9825bc3ABFe1d7A450F82` | Uranus Token |
| **PLUT** | `0xfd1508502696d0E1910eD850c6236d965cc4db11` | Pluto Token |
| **SOLA** | `0x9011191E84Ad832100Ddc891E360f8402457F55E` | Solar Token |
| **WDEV** | `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC` | Wrapped DEV |
| **BEAN** | `0xe573BCA813c741229ffB2488F7856C6cAa841041` | Bean Token |
| **USDC** | `0xBb0CC0fb3e0c06725c67167501f850B4900D6DB5` | USD Coin |

### Moonriver 测试网代币

| 代币 | 地址 | 说明 |
|------|------|------|
| **USDC** | `0xD909178CC99d318e4D46e7E66a972955859670E1` | USD Coin |
| **USDT** | `0x37822de108AFFdd5cDCFDaAa2E32756Da284DB85` | Tether USD |
| **DAI** | `0xCdF746C5C86Df2c2772d2D36E227B4c0203CbA25` | Dai Stablecoin |
| **WETH** | `0x08B40414525687731C23F430CEBb424b332b3d35` | Wrapped Ether |
| **WBTC** | `0x1FC56B105c4F0A1a8038c2b429932B122f6B631f` | Wrapped BTC |
| **BUSD** | `0x9Aac6FB41773af877a2Be73c99897F3DdFACf576` | Binance USD |
| **FRAX** | `0xe75F9ae61926FF1d27d16403C938b4cd15c756d5` | Frax |
| **MIM** | `0xd9224c102A73e5941aBfCd645e08623dC4d182bc` | Magic Internet Money |
| **RELAY** | `0xed13B028697febd70f34cf9a9E280a8f1E98FD29` | Relay Token |
| **BNB** | `0x4c945cD20DD13168BC87f30D55f12dC26512ca33` | Binance Coin |

### 以太坊主网测试代币（用于测试）

| 代币 | 地址 | 说明 |
|------|------|------|
| **USDC** | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | USD Coin |
| **DAI** | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | Dai Stablecoin |
| **DGD** | `0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A` | DigixDAO |

---

## ⛏️ 流动性挖矿相关

### 挖矿合约配置

| 参数 | 值 | 说明 |
|------|-----|------|
| **NBC Token Address** | `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC` | 使用 WNBC 作为奖励代币 |
| **NBC Per Block** | `10 NBC` | 每个区块奖励 10 NBC |
| **Start Block** | `当前区块 + 100` | 挖矿开始区块 |
| **Block Time** | `~12 秒` | 每个区块的时间 |

### 预计年度奖励

```
每年区块数 = 365 * 24 * 60 * 60 / 12 = 2,628,000 个区块
年度总奖励 = 2,628,000 * 10 = 26,280,000 NBC
```

### 待部署的合约

以下合约需要部署后才能使用：

| 合约名称 | 状态 | 说明 |
|---------|------|------|
| **NBCToken.sol** | 待部署 | NBC 奖励代币合约 |
| **LiquidityMining.sol** | 待部署 | 流动性挖矿主合约 |

---

## 📁 配置文件位置

### 前端配置

| 文件 | 路径 | 说明 |
|------|------|------|
| **NBC 地址配置** | `uniswap-interface-moonbeam/src/nbc_address.json` | NBC 链合约地址 |
| **Moonbase 地址配置** | `uniswap-interface-moonbeam/src/moonbase_address.json` | Moonbase 链合约地址 |
| **代币列表** | `uniswap-interface-moonbeam/src/tokens.json` | 支持的代币列表 |
| **环境变量** | `uniswap-interface-moonbeam/.env` | 前端环境配置 |

### SDK 配置

| 文件 | 路径 | 说明 |
|------|------|------|
| **常量配置** | `uniswap-sdk-moonbeam/src/constants.ts` | Factory 地址和 Chain ID |
| **代币配置** | `uniswap-sdk-moonbeam/src/entities/token.ts` | WETH 地址配置 |

### 合约配置

| 文件 | 路径 | 说明 |
|------|------|------|
| **Hardhat 配置** | `uniswap-contracts-moonbeam/hardhat.config.js` | 网络和账户配置 |
| **部署脚本** | `uniswap-contracts-moonbeam/scripts/` | 各种部署脚本 |

---

## 🔧 使用说明

### 1. 在代码中引用合约地址

#### JavaScript/TypeScript
```javascript
import nbcAddresses from './nbc_address.json';

const WETH_ADDRESS = nbcAddresses.WETH;
const FACTORY_ADDRESS = nbcAddresses.factory;
const ROUTER_ADDRESS = nbcAddresses.routerv2;
```

#### Solidity
```solidity
address constant WETH = 0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC;
address constant FACTORY = 0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793;
address constant ROUTER = 0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A;
```

### 2. 连接到 NBC 网络

#### MetaMask 配置
```
网络名称: NBC Chain
RPC URL: https://rpc.nbcex.com
Chain ID: 1281
货币符号: NBC
```

#### Web3.js
```javascript
const web3 = new Web3('https://rpc.nbcex.com');
```

#### Ethers.js
```javascript
const provider = new ethers.providers.JsonRpcProvider('https://rpc.nbcex.com');
```

### 3. 验证合约

```bash
# 在区块浏览器上验证合约
npx hardhat verify --network nbc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 📝 注意事项

1. **安全性**：
   - 生产环境请使用硬件钱包或安全的密钥管理方案
   - 不要在公开的代码库中提交私钥
   - 定期审计智能合约代码

2. **Gas 优化**：
   - 批量操作时使用 Multicall 合约
   - 合理设置 Gas Price 和 Gas Limit

3. **测试**：
   - 在测试网充分测试后再部署到主网
   - 使用小额资金进行初始测试

4. **升级**：
   - 如需升级合约，请使用代理模式
   - 保留旧版本合约地址的记录

---

## 🔗 相关文档

- [NBC 部署文档](./NBC_DEPLOYMENT.md)
- [流动性挖矿指南](./LIQUIDITY_MINING_GUIDE.md)
- [LP 代币说明](./LP_TOKEN_EXPLANATION.md)
- [项目 README](./README.md)

---

## 📅 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2024-12-29 | 1.0.0 | 初始版本，整理所有合约地址 |

---

**最后更新时间**: 2024-12-29
**维护者**: NBC DEX Team
