# LP代币详解 - Uniswap V2

## 🎯 什么是LP代币？

**LP代币（Liquidity Provider Token）= 流动性提供者代币**

这是一个**ERC20代币**，代表您在某个流动性池中的份额。

## 📦 LP代币的生成过程

### 1️⃣ 创建交易对（Pair）

当第一次为两个代币创建流动性池时：

```solidity
// UniswapV2Factory.sol - createPair函数
function createPair(address tokenA, address tokenB) external returns (address pair) {
    // 创建一个新的UniswapV2Pair合约
    // 这个Pair合约本身就是一个ERC20代币！
    pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
}
```

**重点：每个交易对（Pair）合约本身就是一个ERC20代币合约！**

### 2️⃣ 添加流动性获得LP代币

```solidity
// UniswapV2Pair.sol - mint函数
function mint(address to) external lock returns (uint liquidity) {
    // 计算应该铸造多少LP代币
    if (_totalSupply == 0) {
        // 首次添加流动性
        liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
    } else {
        // 后续添加流动性
        liquidity = Math.min(
            amount0.mul(_totalSupply) / _reserve0, 
            amount1.mul(_totalSupply) / _reserve1
        );
    }
    
    // 铸造LP代币给用户
    _mint(to, liquidity);
}
```

## 🔍 LP代币的特征

### 代币信息（来自UniswapV2ERC20.sol）

```solidity
string public constant name = 'Uniswap V2';
string public constant symbol = 'UNI-V2';
uint8 public constant decimals = 18;
```

**每个交易对的LP代币：**
- 名称：`Uniswap V2`
- 符号：`UNI-V2`
- 精度：18位小数
- 标准：ERC20
- 地址：每个交易对有唯一的合约地址

## 📍 如何获取LP代币地址

### 方法1：通过Factory查询

```javascript
const factory = await ethers.getContractAt('UniswapV2Factory', FACTORY_ADDRESS);

// 查询NBC/USDT交易对的LP代币地址
const lpTokenAddress = await factory.getPair(NBC_ADDRESS, USDT_ADDRESS);

console.log('NBC/USDT LP代币地址:', lpTokenAddress);
```

### 方法2：通过事件查询

当创建新交易对时，Factory会发出事件：

```solidity
event PairCreated(address indexed token0, address indexed token1, address pair, uint);
```

### 方法3：计算地址（CREATE2）

```javascript
const { getCreate2Address } = require('@ethersproject/address');
const { keccak256, pack } = require('@ethersproject/solidity');

function computePairAddress(factory, tokenA, tokenB, initCodeHash) {
    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    
    return getCreate2Address(
        factory,
        keccak256(['bytes'], [pack(['address', 'address'], [token0, token1])]),
        initCodeHash
    );
}
```

## 💡 实际示例

### NBC链上的交易对

假设我们有以下代币：
- NBC (Wrapped): `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC`
- USDT: `0x...` (需要部署)
- BTC: `0x...` (需要部署)

### 创建交易对并获取LP代币

```javascript
const factory = await ethers.getContractAt(
    'UniswapV2Factory', 
    '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793'
);

// 1. 创建NBC/USDT交易对
const tx = await factory.createPair(NBC_ADDRESS, USDT_ADDRESS);
await tx.wait();

// 2. 获取LP代币地址
const nbcUsdtLP = await factory.getPair(NBC_ADDRESS, USDT_ADDRESS);
console.log('NBC/USDT LP代币地址:', nbcUsdtLP);

// 3. 查看LP代币信息
const lpToken = await ethers.getContractAt('UniswapV2Pair', nbcUsdtLP);
console.log('LP代币名称:', await lpToken.name());        // "Uniswap V2"
console.log('LP代币符号:', await lpToken.symbol());      // "UNI-V2"
console.log('LP代币总供应:', await lpToken.totalSupply());
console.log('token0:', await lpToken.token0());          // NBC或USDT
console.log('token1:', await lpToken.token1());          // USDT或NBC
```

## 🎨 在流动性挖矿中使用LP代币

### 步骤1：用户添加流动性

```javascript
const router = await ethers.getContractAt('UniswapV2Router02', ROUTER_ADDRESS);

// 添加NBC/USDT流动性
await router.addLiquidity(
    NBC_ADDRESS,
    USDT_ADDRESS,
    ethers.utils.parseEther('1000'),    // 1000 NBC
    ethers.utils.parseEther('5000'),    // 5000 USDT
    0,
    0,
    userAddress,
    deadline
);

// 用户自动获得LP代币
```

### 步骤2：获取LP代币余额

```javascript
const lpToken = await ethers.getContractAt('IERC20', nbcUsdtLP);
const balance = await lpToken.balanceOf(userAddress);
console.log('用户的LP代币数量:', ethers.utils.formatEther(balance));
```

### 步骤3：质押LP代币到挖矿合约

```javascript
const liquidityMining = await ethers.getContractAt('LiquidityMining', MINING_ADDRESS);

// 授权
await lpToken.approve(MINING_ADDRESS, balance);

// 质押
await liquidityMining.deposit(
    0,          // poolId (NBC/USDT池的ID)
    balance     // 质押全部LP代币
);
```

### 步骤4：查看挖矿奖励

```javascript
const pending = await liquidityMining.pendingNbc(0, userAddress);
console.log('待领取NBC奖励:', ethers.utils.formatEther(pending));
```

## 📊 LP代币的价值

### LP代币代表什么？

```
假设NBC/USDT池:
- 总储备: 100,000 NBC + 500,000 USDT
- LP代币总供应: 223,606 UNI-V2
- 您持有: 2,236 UNI-V2 (占1%)

您的LP代币价值:
- 可赎回: 1,000 NBC + 5,000 USDT
- 加上累积的交易手续费
```

### LP代币如何升值？

```
初始状态:
池子: 100,000 NBC + 500,000 USDT
LP总量: 223,606

经过1000笔交易后:
池子: 100,300 NBC + 501,500 USDT  ← 手续费累积
LP总量: 223,606 (不变)

每个LP代币的价值增加了！
```

## 🔧 在LiquidityMining合约中配置

### 添加LP池子

```javascript
const liquidityMining = await ethers.getContractAt('LiquidityMining', MINING_ADDRESS);

// 获取LP代币地址
const factory = await ethers.getContractAt('UniswapV2Factory', FACTORY_ADDRESS);
const nbcUsdtLP = await factory.getPair(NBC_ADDRESS, USDT_ADDRESS);
const nbcBtcLP = await factory.getPair(NBC_ADDRESS, BTC_ADDRESS);
const nbcEthLP = await factory.getPair(NBC_ADDRESS, ETH_ADDRESS);

// 添加池子
await liquidityMining.add(100, nbcUsdtLP, true);  // NBC/USDT池，权重100
await liquidityMining.add(80, nbcBtcLP, true);    // NBC/BTC池，权重80
await liquidityMining.add(60, nbcEthLP, true);    // NBC/ETH池，权重60
```

## 📝 完整的用户流程

```
1. 用户在Uniswap界面添加流动性
   ↓
2. Router合约调用Pair.mint()
   ↓
3. Pair合约铸造LP代币给用户
   ↓
4. 用户授权LP代币给LiquidityMining合约
   ↓
5. 用户调用deposit()质押LP代币
   ↓
6. 开始累积NBC奖励
   ↓
7. 用户随时可以harvest()领取NBC
   ↓
8. 用户可以withdraw()取回LP代币
   ↓
9. 用户可以在Uniswap移除流动性，赎回原始代币+手续费
```

## 🎯 关键要点

1. **LP代币 = ERC20代币**
   - 每个交易对有唯一的LP代币合约
   - 符合标准ERC20接口

2. **LP代币地址 = Pair合约地址**
   - 通过Factory.getPair()获取
   - 每个交易对地址是确定性的（CREATE2）

3. **LP代币代表份额**
   - 持有LP代币 = 拥有池子的一部分
   - 可以随时赎回对应的代币

4. **LP代币会升值**
   - 交易手续费累积在池子里
   - LP代币数量不变，但价值增加

5. **挖矿需要LP代币**
   - 质押LP代币到LiquidityMining合约
   - 获得额外的NBC奖励

## 🔗 相关合约

```
Factory: 0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793
Router: 0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991
WNBC: 0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC

LP代币地址需要通过Factory.getPair()查询
或者在前端界面的Pool页面查看
```

## 💡 总结

**LP代币就是：**
- ✅ 一个ERC20代币
- ✅ 代表您在某个流动性池的份额
- ✅ 可以转账、交易、质押
- ✅ 可以赎回为原始代币对
- ✅ 会因为交易手续费而升值
- ✅ 可以质押到挖矿合约获得额外NBC奖励

希望这个解释清楚了！🎉
