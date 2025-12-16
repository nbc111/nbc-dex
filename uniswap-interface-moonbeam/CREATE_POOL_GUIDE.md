# 🏊 流动性池创建指南

本指南将帮助您在 Moonbeam/NBC 链上创建 Uniswap V2 流动性池。

## 📋 目录

1. [快速开始](#快速开始)
2. [准备工作](#准备工作)
3. [创建单个池子](#创建单个池子)
4. [批量创建池子](#批量创建池子)
5. [常见问题](#常见问题)

## 🚀 快速开始

### 最简单的方法 - 使用 PowerShell 交互式脚本

```powershell
# 在项目根目录运行
.\scripts\create-pool.ps1
```

这个脚本会引导您完成整个流程，无需手动设置环境变量。

## 📦 准备工作

### 1. 确保已安装依赖

项目已经包含了 `ethers` 依赖，无需额外安装。

### 2. 准备钱包和资金

确保您的钱包有：
- ✅ 足够的原生代币（用于支付 gas 费用）
- ✅ 要添加流动性的两种 token

### 3. 获取 Token 地址

#### NBC 链 (Chain ID: 1281) 可用 Token：

| Token | 地址 | 精度 |
|-------|------|------|
| **NBC** | `0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa` | 18 |
| **WBTC** | `0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff` | 8 |
| **WETH** | `0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95` | 18 |
| **WSOL** | `0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325` | 9 |
| **WBNB** | `0x89ce62e131e0d18f9f7162efe63bd6034f72c7a8a79cdb90106285bd2f70f811` | 18 |
| **WXRP** | `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef` | 6 |

## 🎯 创建单个池子

### 方法 1: 使用交互式脚本（推荐）

```powershell
.\scripts\create-pool.ps1
# 选择选项 1，然后按提示输入信息
```

### 方法 2: 使用环境变量

```powershell
# 设置环境变量
$env:PRIVATE_KEY = "your_private_key_here"
$env:RPC_URL = "http://127.0.0.1:9944"
$env:CHAIN_ID = "1281"
$env:TOKEN_A = "0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa"  # NBC
$env:TOKEN_B = "0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff"  # WBTC
$env:AMOUNT_A = "1000"
$env:AMOUNT_B = "0.1"
$env:SLIPPAGE = "0.5"

# 运行脚本
node scripts/createPool.js
```

### 方法 3: 一行命令

```powershell
$env:PRIVATE_KEY="your_key"; $env:TOKEN_A="0x90b2..."; $env:TOKEN_B="0x50e6..."; $env:AMOUNT_A="1000"; $env:AMOUNT_B="0.1"; node scripts/createPool.js
```

## 🔄 批量创建池子

如果您需要创建多个池子（例如：NBC/WBTC, NBC/WETH, WBTC/WETH 等），可以使用批量创建脚本。

### 1. 修改池子配置

编辑 `scripts/batchCreatePools.js` 文件，修改 `POOLS` 数组：

```javascript
const POOLS = [
  {
    name: 'NBC/WBTC',
    tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa',
    tokenB: '0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff',
    amountA: '10000',
    amountB: '1',
    slippage: 0.5
  },
  // 添加更多池子...
];
```

### 2. 运行批量创建脚本

#### 使用交互式脚本：
```powershell
.\scripts\create-pool.ps1
# 选择选项 2
```

#### 或直接运行：
```powershell
$env:PRIVATE_KEY = "your_private_key_here"
$env:RPC_URL = "http://127.0.0.1:9944"
$env:CHAIN_ID = "1281"

node scripts/batchCreatePools.js
```

## 📊 执行流程

脚本会自动完成以下步骤：

1. ✅ 连接到区块链网络
2. ✅ 验证 token 地址和余额
3. ✅ 检查池子是否已存在
4. ✅ 授权 token 给 Router 合约
5. ✅ 添加流动性
6. ✅ 显示池子地址和交易信息

## 💡 示例场景

### 场景 1: 创建 NBC/WBTC 池子

```powershell
$env:PRIVATE_KEY = "0x1234..."
$env:TOKEN_A = "0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa"  # NBC
$env:TOKEN_B = "0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff"  # WBTC
$env:AMOUNT_A = "10000"  # 10000 NBC
$env:AMOUNT_B = "1"      # 1 WBTC

node scripts/createPool.js
```

### 场景 2: 创建 WETH/WSOL 池子

```powershell
$env:PRIVATE_KEY = "0x1234..."
$env:TOKEN_A = "0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95"  # WETH
$env:TOKEN_B = "0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325"  # WSOL
$env:AMOUNT_A = "5"      # 5 WETH
$env:AMOUNT_B = "100"    # 100 WSOL

node scripts/createPool.js
```

## ❓ 常见问题

### Q1: 如何知道需要多少 token？

A: 这取决于您想要的初始价格比例。例如：
- 如果 1 NBC = 0.0001 WBTC，添加 10000 NBC 和 1 WBTC
- 如果 1 WETH = 20 WSOL，添加 5 WETH 和 100 WSOL

### Q2: 什么是滑点？

A: 滑点是允许的价格变动百分比。默认 0.5% 意味着实际添加的数量可以比预期少 0.5%。

### Q3: 池子已存在怎么办？

A: 如果池子已存在，脚本会直接添加流动性到现有池子，不会创建新池子。

### Q4: 授权是什么？

A: 授权是允许 Router 合约使用您的 token。这是一次性操作，之后无需再次授权。

### Q5: 如何查看创建的池子？

A: 创建成功后，脚本会显示池子地址。您可以：
1. 在 DEX 界面的 Pool 页面查看
2. 使用区块浏览器查看池子合约

### Q6: 创建失败怎么办？

常见原因和解决方法：

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| 余额不足 | Token 数量不够 | 检查钱包余额 |
| Gas 不足 | 原生代币不够 | 充值原生代币 |
| 授权失败 | 网络问题 | 检查网络连接 |
| 滑点过低 | 价格波动大 | 增加滑点容忍度 |

### Q7: 可以撤销流动性吗？

A: 可以！在 DEX 界面的 Pool 页面，您可以移除流动性。

### Q8: 创建池子需要多少 Gas？

A: 通常需要：
- 首次授权：~50,000 gas × 2 (两个 token)
- 创建池子：~200,000 - 300,000 gas

## 🔒 安全提示

⚠️ **重要安全提示**：

1. ❌ **永远不要**将私钥提交到 Git
2. ❌ **永远不要**在公共场合分享私钥
3. ✅ 使用环境变量存储私钥
4. ✅ 在测试网测试后再在主网操作
5. ✅ 仔细检查所有参数
6. ✅ 从小额开始测试

## 📚 相关文档

- [Uniswap V2 文档](https://docs.uniswap.org/protocol/V2/introduction)
- [Moonbeam 文档](https://docs.moonbeam.network/)
- [项目 README](./README.md)
- [脚本详细文档](./scripts/README.md)

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [scripts/README.md](./scripts/README.md) 获取详细文档
2. 检查错误信息并参考常见问题
3. 确认网络连接和节点状态
4. 验证所有参数是否正确

## 🎉 成功案例

创建成功后，您会看到类似输出：

```
✅ 流动性添加成功！
   区块号: 12345
   Gas 使用: 250000

🎉 池子地址: 0xabcd...1234

✨ 完成！您现在可以在 DEX 界面中看到这个交易对了。
```

现在您可以：
- 在 Pool 页面查看您的流动性
- 在 Swap 页面使用这个交易对
- 赚取交易手续费

祝您使用愉快！🚀
