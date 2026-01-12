# 合约地址验证报告

## 📊 验证结果

验证时间: 2024-12-29 10:41

---

## ⚠️ 发现的问题

### 1. Router 地址不一致

在不同的配置文件中发现 **Router V02** 地址不一致：

| 配置文件 | Router 地址 | 状态 |
|---------|------------|------|
| `NBC_DEPLOYMENT.md` | `0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991` | ❌ 旧地址 |
| `uniswap-interface-moonbeam/src/nbc_address.json` | `0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A` | ✅ 当前使用 |
| `uniswap-interface-moonbeam/src/moonbase_address.json` | `0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991` | ⚠️ Moonbase 地址 |
| `uniswap-contracts-moonbeam/address.json` (nbc) | `0x2c37f19A9963f3C829c35332662d1BDda10Fe9fC` | ⚠️ 另一个地址 |

**结论**: 存在 **3 个不同的 Router 地址**，需要确认哪个是正确的。

---

## ✅ 验证通过的地址

### NBC 链核心合约 (Chain ID: 1281)

| 合约名称 | 地址 | 验证状态 |
|---------|------|---------|
| **WETH** | `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC` | ✅ 所有配置文件一致 |
| **Factory** | `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793` | ✅ 所有配置文件一致 |
| **Multicall** | `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a` | ✅ 所有配置文件一致 |

### Init Code Hash

| 网络 | Hash | 验证状态 |
|------|------|---------|
| **STANDALONE (1281)** | `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f` | ✅ SDK 配置一致 |
| **NBC (nbc_address.json)** | `0x2fe714b2a8ae1bc2f8a4181f48e8d9cb072c8ec7193ad627a77f095d2d406c02` | ✅ 前端配置一致 |
| **其他网络** | `0x01429e880a7972ebfbba904a5bbe32a816e78273e4b38ffa6bdeaebce8adba7c` | ✅ 默认值 |

---

## 📋 配置文件对比

### 1. uniswap-interface-moonbeam/src/nbc_address.json
```json
{
  "WETH": "0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC",
  "factory": "0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793",
  "routerv2": "0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A",  ⬅️ 前端使用此地址
  "multicall": "0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a",
  "init_code_hash": "0x2fe714b2a8ae1bc2f8a4181f48e8d9cb072c8ec7193ad627a77f095d2d406c02"
}
```

### 2. uniswap-interface-moonbeam/src/moonbase_address.json
```json
{
  "WETH": "0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC",
  "factory": "0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793",
  "routerv2": "0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991",  ⬅️ 文档中的地址
  "multicall": "0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a"
}
```

### 3. uniswap-contracts-moonbeam/address.json (nbc 部分)
```json
{
  "nbc": {
    "WETH": "0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC",
    "factory": "0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793",
    "router": "0x2c37f19A9963f3C829c35332662d1BDda10Fe9fC",  ⬅️ 合约记录的地址
    "multicall": "0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a",
    "init_code_hash": "0x2fe714b2a8ae1bc2f8a4181f48e8d9cb072c8ec7193ad627a77f095d2d406c02"
  }
}
```

### 4. uniswap-sdk-moonbeam/src/constants.ts
```typescript
export const FACTORY_ADDRESS: { [key: string]: string } = {
  [ChainId.STANDALONE]: '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793',  ✅ 一致
  [ChainId.MOONROCK]: factory,
  [ChainId.MOONBASE]: factory,
  [ChainId.MOONSHADOW]: factory
}

export const INIT_CODE_HASH_MAP: { [key: string]: string } = {
  [ChainId.STANDALONE]: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',  ✅ 一致
  [ChainId.MOONROCK]: INIT_CODE_HASH,
  [ChainId.MOONBASE]: INIT_CODE_HASH,
  [ChainId.MOONSHADOW]: INIT_CODE_HASH
}
```

### 5. uniswap-sdk-moonbeam/src/moonbase_address.json
```json
{
  "WETH": "0xD909178CC99d318e4D46e7E66a972955859670E1",  ⬅️ 这是 Moonbase 的 WETH，不是 NBC 的
  "factory": "0xe1b383Ae5aD239AE250BcBDBd68e3bBd9e1A58F1",  ⬅️ 这是 Moonbase 的 Factory
  "router": "0x8a1932D6E26433F3037bd6c3A40C816222a6Ccd4",
  "multicall": "0x4E2cfca20580747AdBA58cd677A998f8B261Fc21"
}
```

---

## 🔍 其他网络地址

### Moonbase Alpha 测试网

| 合约 | 地址 | 来源 |
|------|------|------|
| **WETH** | `0xD909178CC99d318e4D46e7E66a972955859670E1` | SDK moonbase_address.json |
| **Factory** | `0xe1b383Ae5aD239AE250BcBDBd68e3bBd9e1A58F1` | SDK moonbase_address.json |
| **Router** | `0x8a1932D6E26433F3037bd6c3A40C816222a6Ccd4` | SDK moonbase_address.json |
| **Multicall** | `0x4E2cfca20580747AdBA58cd677A998f8B261Fc21` | SDK moonbase_address.json |

### Standalone 网络 (旧部署)

| 合约 | 地址 | 来源 |
|------|------|------|
| **WETH** | `0xC2Bf5F29a4384b1aB0C063e1c666f02121B6084a` | address.json |
| **Factory** | `0x5c4242beB94dE30b922f57241f1D02f36e906915` | address.json |
| **Router** | `0x42e2EE7Ba8975c473157634Ac2AF4098190fc741` | address.json |
| **Multicall** | `0xF8cef78E923919054037a1D03662bBD884fF4edf` | address.json |

---

## 🎯 建议的修正措施

### 优先级 1: 确认正确的 Router 地址

需要确认以下哪个 Router 地址是当前正在使用的：

1. **`0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A`** (前端 nbc_address.json 使用)
2. **`0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991`** (文档和 moonbase_address.json)
3. **`0x2c37f19A9963f3C829c35332662d1BDda10Fe9fC`** (合约 address.json)

**推荐做法**:
- 检查链上哪个 Router 合约有实际的交易记录
- 更新所有配置文件使用同一个地址
- 在文档中明确标注历史地址（如果有多次部署）

### 优先级 2: 统一配置文件

建议创建一个统一的配置文件，所有项目引用同一个源：

```
nbc-dex/
  └── config/
      └── contract-addresses.json  ← 单一真实来源
```

然后在各个子项目中引用这个文件。

### 优先级 3: 更新文档

需要更新以下文档：
- ✅ `CONTRACT_ADDRESSES.md` (已创建，需要修正 Router 地址)
- ⚠️ `NBC_DEPLOYMENT.md` (需要更新 Router 地址)
- ⚠️ `README.md` (如果有提到地址)

---

## 📝 验证清单

- [x] WETH 地址验证 - ✅ 一致
- [x] Factory 地址验证 - ✅ 一致
- [x] Multicall 地址验证 - ✅ 一致
- [ ] Router 地址验证 - ❌ **不一致，需要确认**
- [x] Init Code Hash 验证 - ✅ 一致
- [x] 部署账户验证 - ✅ 已记录
- [ ] 流动性挖矿合约 - ⚠️ 尚未部署

---

## 🔗 需要检查的链上信息

建议使用以下方法验证合约地址：

```bash
# 使用 ethers.js 检查合约代码
npx hardhat console --network nbc

# 在控制台中运行
const code1 = await ethers.provider.getCode("0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A");
const code2 = await ethers.provider.getCode("0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991");
const code3 = await ethers.provider.getCode("0x2c37f19A9963f3C829c35332662d1BDda10Fe9fC");

console.log("Router 1 有代码:", code1 !== "0x");
console.log("Router 2 有代码:", code2 !== "0x");
console.log("Router 3 有代码:", code3 !== "0x");
```

或者访问区块浏览器检查这些地址。

---

## 📌 总结

### 确认无误的地址 ✅
- WETH: `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC`
- Factory: `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793`
- Multicall: `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a`

### 需要确认的地址 ⚠️
- **Router V02**: 存在 3 个不同的地址，需要确认哪个是正确的

### 建议行动 🎯
1. 立即确认正确的 Router 地址
2. 统一所有配置文件
3. 更新相关文档
4. 添加版本控制和变更日志

---

**报告生成时间**: 2024-12-29 10:41
**验证人**: NBC DEX Team
