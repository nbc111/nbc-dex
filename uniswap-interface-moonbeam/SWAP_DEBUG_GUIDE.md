# Swap 页面无法计算输出数量 - 诊断指南

## 问题描述

在 Swap 页面选择 NBC 和 ETH，点击 MAX 按钮后，下方的 ETH 编辑框没有显示对应的数量。

## 可能的原因

### 1. 交易对不存在
- **症状**: 显示 "Insufficient liquidity for this trade"
- **原因**: 没有创建 NBC/ETH 流动性池
- **解决**: 在 Pool 页面创建流动性池

### 2. 交易对地址计算错误
- **症状**: 交易对存在但无法找到
- **原因**: 
  - `INIT_CODE_HASH` 配置错误
  - `FACTORY_ADDRESS` 配置错误
- **检查**: 运行诊断工具验证地址计算

### 3. Multicall 数据获取失败
- **症状**: 交易对存在但 reserves 无法获取
- **原因**:
  - Multicall 合约地址错误
  - 网络连接问题
  - 数据解析失败
- **检查**: 运行诊断工具测试 Multicall

### 4. 交易对状态为 LOADING
- **症状**: 页面一直在加载
- **原因**: Multicall 调用延迟或失败
- **解决**: 等待几秒钟或刷新页面

### 5. Reserves 为 0
- **症状**: 交易对存在但无法交易
- **原因**: 流动性池已创建但 reserves 为 0
- **解决**: 检查流动性池是否真的添加了流动性

## 诊断步骤

### 方法 1: 使用诊断工具

1. 打开浏览器访问: `http://localhost:3001/diagnose-swap.html`
2. 连接 MetaMask 钱包
3. 点击 "运行完整诊断" 按钮
4. 查看各项检查结果

### 方法 2: 使用浏览器控制台

1. 打开浏览器控制台 (F12)
2. 加载 ethers.js (如果未加载):
   ```javascript
   const script = document.createElement('script');
   script.src = 'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js';
   document.head.appendChild(script);
   ```
3. 等待 ethers 加载后，运行 `public/debug-swap.js` 的内容
4. 查看控制台输出

### 方法 3: 手动检查

在浏览器控制台运行以下代码：

```javascript
// 1. 检查交易对是否存在
const factory = '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793';
const wdev = '0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC';
const eth = '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const factoryABI = ['function getPair(address tokenA, address tokenB) external view returns (address pair)'];
const factoryContract = new ethers.Contract(factory, factoryABI, provider);

factoryContract.getPair(wdev, eth).then(pairAddress => {
    console.log('交易对地址:', pairAddress);
    if (pairAddress === ethers.constants.AddressZero) {
        console.error('❌ 交易对不存在！');
    } else {
        console.log('✅ 交易对存在');
        // 检查 reserves
        const pairABI = ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'];
        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);
        pairContract.getReserves().then(reserves => {
            console.log('Reserve0:', ethers.utils.formatEther(reserves.reserve0));
            console.log('Reserve1:', ethers.utils.formatEther(reserves.reserve1));
        });
    }
});
```

## 常见问题排查

### Q1: 交易对存在但 Swap 页面仍无法计算

**可能原因**:
1. React 状态未更新
2. Multicall 数据未同步
3. 浏览器缓存问题

**解决方法**:
1. 硬刷新页面 (Ctrl+Shift+R)
2. 清除浏览器缓存
3. 等待几秒钟让 Multicall 同步数据
4. 尝试切换代币（从 NBC 切换到其他代币再切回来）

### Q2: 交易对地址计算不匹配

**检查配置**:
- `uniswap-sdk-moonbeam/src/constants.ts` 中的 `INIT_CODE_HASH_MAP[1281]`
- 应该等于: `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`

### Q3: Multicall 调用失败

**检查**:
- `uniswap-interface-moonbeam/src/constants/multicall/index.ts` 中的 `MULTICALL_NETWORKS[1281]`
- 应该等于: `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a`

### Q4: 交易对状态一直是 LOADING

**可能原因**:
1. Multicall 合约未部署或地址错误
2. 网络连接问题
3. RPC 节点响应慢

**解决方法**:
1. 检查 Multicall 合约是否部署
2. 检查网络连接
3. 尝试切换到其他 RPC 节点

## 代码检查清单

- [ ] `FACTORY_ADDRESS[1281]` = `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793`
- [ ] `INIT_CODE_HASH_MAP[1281]` = `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`
- [ ] `MULTICALL_NETWORKS[1281]` = `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a`
- [ ] `WDEV[1281].address` = `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC`
- [ ] `ETH_NBC.address` = `0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3`

## 调试技巧

### 在 React DevTools 中检查状态

1. 安装 React DevTools 扩展
2. 打开 Swap 页面
3. 在 React DevTools 中找到 `Swap` 组件
4. 检查以下状态:
   - `v2Trade`: 应该是 Trade 对象，不是 `null` 或 `undefined`
   - `allowedPairs`: 应该包含至少一个 Pair 对象
   - `pairState`: 应该是 `PairState.EXISTS`

### 添加临时日志

在 `src/hooks/Trades.ts` 的 `useAllCommonPairs` 函数中添加:

```typescript
console.log('useAllCommonPairs:', {
  currencyA,
  currencyB,
  tokenA,
  tokenB,
  pairAddresses,
  allPairs,
  validPairs: allPairs.filter(([state]) => state === PairState.EXISTS)
});
```

## 联系支持

如果以上方法都无法解决问题，请提供以下信息:

1. 诊断工具的输出结果
2. 浏览器控制台的错误信息
3. React DevTools 中的状态截图
4. 网络请求日志 (Network 标签页)

