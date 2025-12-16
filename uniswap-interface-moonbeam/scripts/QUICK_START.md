# 🚀 快速开始 - 创建流动性池

## 方式 1: 使用示例命令（最简单）

### 创建 NBC/WBTC 池子

```powershell
# 设置您的私钥
$env:PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"

# 设置 RPC URL（根据您的实际情况修改）
$env:RPC_URL = "http://127.0.0.1:9944"

# 设置 Token 地址和数量
$env:TOKEN_A = "0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa"  # NBC
$env:TOKEN_B = "0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff"  # WBTC
$env:AMOUNT_A = "1000"   # 1000 NBC
$env:AMOUNT_B = "0.1"    # 0.1 WBTC

# 运行脚本
node scripts/createPool.js
```

### 创建 NBC/WETH 池子

```powershell
$env:PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"
$env:RPC_URL = "http://127.0.0.1:9944"
$env:TOKEN_A = "0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa"  # NBC
$env:TOKEN_B = "0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95"  # WETH
$env:AMOUNT_A = "1000"   # 1000 NBC
$env:AMOUNT_B = "1"      # 1 WETH

node scripts/createPool.js
```

## 方式 2: 一行命令

```powershell
$env:PRIVATE_KEY="your_key"; $env:TOKEN_A="0x90b2..."; $env:TOKEN_B="0x50e6..."; $env:AMOUNT_A="1000"; $env:AMOUNT_B="0.1"; node scripts/createPool.js
```

## 方式 3: 批量创建多个池子

```powershell
# 设置私钥
$env:PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE"
$env:RPC_URL = "http://127.0.0.1:9944"

# 运行批量创建脚本（会创建 6 个池子）
node scripts/batchCreatePools.js
```

## 📝 重要提示

1. **替换私钥**: 将 `YOUR_PRIVATE_KEY_HERE` 替换为您的实际私钥
2. **检查 RPC**: 确认 RPC URL 是否正确（默认: http://127.0.0.1:9944）
3. **确认余额**: 确保钱包有足够的 token 和 gas 费用
4. **调整数量**: 根据您的实际情况调整 token 数量

## 🎯 可用的 Token 地址（NBC 链）

| Token | 地址 |
|-------|------|
| NBC | `0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa` |
| WBTC | `0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff` |
| WETH | `0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95` |
| WSOL | `0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325` |
| WBNB | `0x89ce62e131e0d18f9f7162efe63bd6034f72c7a8a79cdb90106285bd2f70f811` |

## 📊 执行流程

脚本会自动：
1. ✅ 连接到区块链
2. ✅ 检查余额
3. ✅ 授权 token
4. ✅ 创建/添加流动性
5. ✅ 显示池子地址

## ❓ 遇到问题？

查看详细文档：
- [CREATE_POOL_GUIDE.md](../CREATE_POOL_GUIDE.md) - 完整使用指南
- [scripts/README.md](./README.md) - 技术文档
