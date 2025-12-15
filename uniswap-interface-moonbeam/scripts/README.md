# 流动性池创建脚本

这个脚本用于在 Moonbeam/NBC 链上创建 Uniswap V2 流动性池。

## 功能特性

- ✅ 自动检查 token 余额
- ✅ 自动授权 token 给 Router 合约
- ✅ 支持自定义滑点设置
- ✅ 自动检测池子是否已存在
- ✅ 详细的执行日志
- ✅ 支持多链（NBC, Moonrock, Moonbase, Moonshadow）

## 前置要求

1. 安装依赖：
```bash
npm install ethers
```

2. 确保您的钱包有足够的：
   - 原生代币（用于支付 gas 费用）
   - 要添加流动性的两种 token

## 使用方法

### 方法 1: 使用环境变量（推荐）

```bash
# 设置环境变量
$env:PRIVATE_KEY="your_private_key_here"
$env:RPC_URL="http://127.0.0.1:9944"
$env:CHAIN_ID="1281"
$env:TOKEN_A="0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa"
$env:TOKEN_B="0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff"
$env:AMOUNT_A="1000"
$env:AMOUNT_B="0.1"
$env:SLIPPAGE="0.5"

# 运行脚本
node scripts/createPool.js
```

### 方法 2: 一行命令

```bash
# Windows PowerShell
$env:PRIVATE_KEY="your_key"; $env:TOKEN_A="0x..."; $env:TOKEN_B="0x..."; $env:AMOUNT_A="100"; $env:AMOUNT_B="100"; node scripts/createPool.js

# Linux/Mac
PRIVATE_KEY=your_key TOKEN_A=0x... TOKEN_B=0x... AMOUNT_A=100 AMOUNT_B=100 node scripts/createPool.js
```

### 方法 3: 修改脚本默认值

直接编辑 `createPool.js` 文件中的 `main()` 函数，修改默认配置。

## 配置参数说明

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `PRIVATE_KEY` | 钱包私钥（必需） | - | `0x1234...` |
| `RPC_URL` | RPC 节点地址 | `http://127.0.0.1:9944` | `http://127.0.0.1:9944` |
| `CHAIN_ID` | 链 ID | `1281` | `1281` (NBC) |
| `TOKEN_A` | Token A 地址 | NBC 地址 | `0x90b2...` |
| `TOKEN_B` | Token B 地址 | WBTC 地址 | `0x50e6...` |
| `AMOUNT_A` | Token A 数量 | `1000` | `1000` |
| `AMOUNT_B` | Token B 数量 | `0.1` | `0.1` |
| `SLIPPAGE` | 滑点容忍度 (%) | `0.5` | `0.5` |

## 支持的链 ID

| 链名称 | Chain ID | 说明 |
|--------|----------|------|
| NBC | 1281 | NBC 主链 |
| Moonrock | 1286 | Moonrock 测试网 |
| Moonbase | 1287 | Moonbase Alpha 测试网 |
| Moonshadow | 1288 | Moonshadow 测试网 |

## Token 地址参考

### NBC 链 (ChainId: 1281)

| Token | 地址 | 说明 |
|-------|------|------|
| NBC | `0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa` | NBC 原生代币 |
| WBTC | `0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff` | 包装比特币 |
| WETH | `0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95` | 包装以太坊 |
| WSOL | `0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325` | 包装 Solana |
| WBNB | `0x89ce62e131e0d18f9f7162efe63bd6034f72c7a8a79cdb90106285bd2f70f811` | 包装 BNB |
| WXRP | `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef` | 包装 XRP |

### Moonrock/Moonbase 链 (ChainId: 1286/1287)

查看 `src/tokens.json` 文件获取完整的 token 列表。

## 执行流程

脚本会按以下步骤执行：

1. 🔗 连接到指定的 RPC 节点
2. 📝 读取 Router 和 Factory 合约地址
3. 💰 获取两个 token 的信息（符号、精度）
4. 💼 检查钱包余额是否足够
5. 🔍 检查池子是否已存在
6. 🔐 授权 Token A 给 Router（如需要）
7. 🔐 授权 Token B 给 Router（如需要）
8. 🏊 添加流动性到池子
9. ✅ 显示池子地址和交易信息

## 示例输出

```
🚀 开始创建流动性池子...

📍 使用地址: 0x1234...5678
⛓️  链 ID: 1281

📝 Router 地址: 0xabcd...ef01
📝 Factory 地址: 0x9876...5432

💰 Token A: NBC (18 decimals)
💰 Token B: WBTC (8 decimals)

📊 添加流动性:
   NBC: 1000 (最小: 995)
   WBTC: 0.1 (最小: 0.0995)

💼 当前余额:
   NBC: 10000
   WBTC: 1

ℹ️  池子不存在，将在添加流动性时自动创建

🔐 检查 NBC 授权...
   ✅ NBC 已授权

🔐 检查 WBTC 授权...
   正在授权 WBTC...
   交易哈希: 0x1234...
   ✅ WBTC 授权成功

🏊 正在添加流动性...
   交易哈希: 0x5678...
   等待确认...

✅ 流动性添加成功！
   区块号: 12345
   Gas 使用: 250000

🎉 池子地址: 0xabcd...1234

✨ 完成！您现在可以在 DEX 界面中看到这个交易对了。
```

## 常见问题

### 1. 余额不足错误

确保您的钱包有足够的：
- 原生代币（用于 gas）
- 两种要添加的 token

### 2. 授权失败

如果授权交易失败，检查：
- Gas 费用是否足够
- Token 地址是否正确
- 网络连接是否正常

### 3. 添加流动性失败

可能的原因：
- 滑点设置太低
- 池子已存在且价格变化
- Gas limit 不足

解决方法：
- 增加滑点容忍度
- 调整 token 数量比例
- 增加 gas limit

### 4. RPC 连接失败

检查：
- RPC URL 是否正确
- 节点是否在运行
- 网络连接是否正常

## 安全提示

⚠️ **重要安全提示**：

1. **永远不要**将私钥提交到 Git 仓库
2. **永远不要**在公共场合分享私钥
3. 使用环境变量或安全的密钥管理工具
4. 在主网操作前，先在测试网测试
5. 确认所有参数无误后再执行

## 批量创建池子

如果需要创建多个池子，可以创建一个批处理脚本：

```javascript
// batchCreatePools.js
const { createPool } = require('./createPool');

const pools = [
  {
    tokenA: '0x...',
    tokenB: '0x...',
    amountA: '1000',
    amountB: '0.1'
  },
  // 添加更多池子配置
];

async function main() {
  for (const pool of pools) {
    await createPool({
      rpcUrl: process.env.RPC_URL,
      privateKey: process.env.PRIVATE_KEY,
      chainId: 1281,
      ...pool
    });
  }
}

main();
```

## 技术支持

如有问题，请查看：
- 项目 README.md
- Uniswap V2 文档
- Moonbeam 文档

## 许可证

与主项目相同
