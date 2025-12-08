# Uniswap V2 部署到 NBC 链

## 🎉 部署成功！

### 部署的合约地址

所有合约已成功部署到 NBC 链 (Chain ID: 1281)

- **WETH (Wrapped DEV)**: `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC`
- **Factory**: `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793`
- **Router V02**: `0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991`
- **Multicall**: `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a`

### 网络配置

- **RPC URL**: `http://206.238.196.207:9944`
- **Chain ID**: `1281`
- **部署账户**: `0x1A0370aE087A089eC5895A0744e3B750993A24a8`

## 📝 使用说明

### 1. 访问前端界面

前端界面运行在: `http://localhost:3001`

### 2. 配置 MetaMask

在 MetaMask 中添加 NBC 网络：

- **网络名称**: NBC Chain
- **RPC URL**: `http://206.238.196.207:9944`
- **Chain ID**: `1281`
- **货币符号**: DEV
- **区块浏览器**: (如果有的话)

### 3. 连接钱包

1. 打开前端界面 `http://localhost:3001`
2. 点击右上角 "Connect Wallet"
3. 选择 MetaMask
4. 确保 MetaMask 已切换到 NBC 网络 (Chain ID: 1281)

### 4. 开始使用

现在你可以：
- ✅ 交换代币 (Swap)
- ✅ 添加流动性 (Add Liquidity)
- ✅ 移除流动性 (Remove Liquidity)
- ✅ 创建交易对 (Create Pairs)

## 🔧 技术细节

### SDK 配置

SDK 已更新为使用 NBC 链部署的合约地址：
- Factory 地址已更新到 `constants.ts`
- WETH 地址已更新到 `token.ts`

### 前端配置

前端 `.env` 文件配置：
```
NODE_OPTIONS=--openssl-legacy-provider
PORT=3001
REACT_APP_NETWORK_URL=http://206.238.196.207:9944
REACT_APP_CHAIN_ID=1281
```

### 合约配置

Hardhat 配置文件中的 NBC 网络：
```javascript
nbc: {
  url: 'http://206.238.196.207:9944',
  accounts: ['0x426231b32113022e22bfc31dc90c15561b6b32ae2dc1d8f0bfaf39c638664a8f'],
  chainId: 1281,
  gasPrice: 'auto',
}
```

## 📚 项目结构

```
moonbeam-uniswap/
├── uniswap-contracts-moonbeam/  # 智能合约
│   ├── contracts/               # Solidity 合约
│   ├── scripts/                 # 部署脚本
│   └── hardhat.config.js        # Hardhat 配置
├── uniswap-sdk-moonbeam/        # SDK
│   └── src/
│       ├── constants.ts         # 链配置和合约地址
│       └── entities/token.ts    # WETH 配置
└── uniswap-interface-moonbeam/  # 前端界面
    ├── src/
    │   ├── connectors/          # 钱包连接器
    │   └── nbc_address.json     # NBC 合约地址
    └── .env                     # 环境变量配置
```

## 🚀 重新部署

如果需要重新部署合约：

```bash
cd uniswap-contracts-moonbeam
npx hardhat run --network nbc scripts/deploy-factory.js
```

## ⚠️ 注意事项

1. **私钥安全**: 请妥善保管私钥，不要泄露给他人
2. **测试环境**: 这是测试环境部署，请勿用于生产环境
3. **Gas 费用**: 确保部署账户有足够的 DEV 代币支付 gas 费用
4. **网络连接**: 确保 RPC 节点稳定可访问

## 📞 支持

如有问题，请检查：
- MetaMask 是否连接到正确的网络 (Chain ID: 1281)
- RPC 节点是否正常运行
- 账户是否有足够的余额

---

**部署时间**: 2025-12-03
**部署者**: Cascade AI Assistant
