const { ethers } = require('ethers');
const fs = require('fs');

// 读取配置文件
const nbcAddress = require('../src/nbc_address.json');
const moonbaseAddress = require('../src/moonbase_address.json');

// Uniswap V2 Router ABI (只包含需要的函数)
const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)'
];

// ERC20 ABI (只包含需要的函数)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

// Uniswap V2 Factory ABI
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)'
];

/**
 * 创建流动性池子
 * @param {Object} config - 配置对象
 * @param {string} config.rpcUrl - RPC URL
 * @param {string} config.privateKey - 私钥
 * @param {string} config.tokenA - Token A 地址
 * @param {string} config.tokenB - Token B 地址
 * @param {string} config.amountA - Token A 数量 (人类可读格式，如 "100")
 * @param {string} config.amountB - Token B 数量 (人类可读格式，如 "100")
 * @param {number} config.chainId - 链 ID (1281=NBC, 1286=Moonrock, 1287=Moonbase, 1288=Moonshadow)
 */
async function createPool(config) {
  const {
    rpcUrl,
    privateKey,
    tokenA,
    tokenB,
    amountA,
    amountB,
    chainId = 1281,
    slippage = 0.5 // 默认 0.5% 滑点
  } = config;

  console.log('🚀 开始创建流动性池子...\n');

  // 连接到网络
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`📍 使用地址: ${wallet.address}`);
  console.log(`⛓️  链 ID: ${chainId}\n`);

  // 获取 Router 地址
  let routerAddress;
  let factoryAddress;
  
  if (chainId === 1281) {
    routerAddress = nbcAddress.routerv2;
    factoryAddress = nbcAddress.factory;
  } else {
    routerAddress = moonbaseAddress.routerv2;
    factoryAddress = moonbaseAddress.factory;
  }

  console.log(`📝 Router 地址: ${routerAddress}`);
  console.log(`📝 Factory 地址: ${factoryAddress}\n`);

  // 创建合约实例
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, wallet);
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, wallet);
  const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, wallet);
  const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, wallet);

  try {
    // 获取 token 信息
    const [symbolA, symbolB, decimalsA, decimalsB] = await Promise.all([
      tokenAContract.symbol(),
      tokenBContract.symbol(),
      tokenAContract.decimals(),
      tokenBContract.decimals()
    ]);

    console.log(`💰 Token A: ${symbolA} (${decimalsA} decimals)`);
    console.log(`💰 Token B: ${symbolB} (${decimalsB} decimals)\n`);

    // 转换数量为 wei
    const amountADesired = ethers.utils.parseUnits(amountA, decimalsA);
    const amountBDesired = ethers.utils.parseUnits(amountB, decimalsB);

    // 计算最小数量（考虑滑点）
    const amountAMin = amountADesired.mul(100 - slippage * 100).div(10000);
    const amountBMin = amountBDesired.mul(100 - slippage * 100).div(10000);

    console.log(`📊 添加流动性:`);
    console.log(`   ${symbolA}: ${amountA} (最小: ${ethers.utils.formatUnits(amountAMin, decimalsA)})`);
    console.log(`   ${symbolB}: ${amountB} (最小: ${ethers.utils.formatUnits(amountBMin, decimalsB)})\n`);

    // 检查余额
    const [balanceA, balanceB] = await Promise.all([
      tokenAContract.balanceOf(wallet.address),
      tokenBContract.balanceOf(wallet.address)
    ]);

    console.log(`💼 当前余额:`);
    console.log(`   ${symbolA}: ${ethers.utils.formatUnits(balanceA, decimalsA)}`);
    console.log(`   ${symbolB}: ${ethers.utils.formatUnits(balanceB, decimalsB)}\n`);

    if (balanceA.lt(amountADesired)) {
      throw new Error(`${symbolA} 余额不足！需要 ${amountA}，但只有 ${ethers.utils.formatUnits(balanceA, decimalsA)}`);
    }
    if (balanceB.lt(amountBDesired)) {
      throw new Error(`${symbolB} 余额不足！需要 ${amountB}，但只有 ${ethers.utils.formatUnits(balanceB, decimalsB)}`);
    }

    // 检查是否已经存在池子
    const pairAddress = await factory.getPair(tokenA, tokenB);
    if (pairAddress !== ethers.constants.AddressZero) {
      console.log(`ℹ️  池子已存在: ${pairAddress}\n`);
    } else {
      console.log(`ℹ️  池子不存在，将在添加流动性时自动创建\n`);
    }

    // 检查并授权 Token A
    console.log(`🔐 检查 ${symbolA} 授权...`);
    const allowanceA = await tokenAContract.allowance(wallet.address, routerAddress);
    if (allowanceA.lt(amountADesired)) {
      console.log(`   正在授权 ${symbolA}...`);
      const approveTxA = await tokenAContract.approve(routerAddress, ethers.constants.MaxUint256);
      console.log(`   交易哈希: ${approveTxA.hash}`);
      await approveTxA.wait();
      console.log(`   ✅ ${symbolA} 授权成功\n`);
    } else {
      console.log(`   ✅ ${symbolA} 已授权\n`);
    }

    // 检查并授权 Token B
    console.log(`🔐 检查 ${symbolB} 授权...`);
    const allowanceB = await tokenBContract.allowance(wallet.address, routerAddress);
    if (allowanceB.lt(amountBDesired)) {
      console.log(`   正在授权 ${symbolB}...`);
      const approveTxB = await tokenBContract.approve(routerAddress, ethers.constants.MaxUint256);
      console.log(`   交易哈希: ${approveTxB.hash}`);
      await approveTxB.wait();
      console.log(`   ✅ ${symbolB} 授权成功\n`);
    } else {
      console.log(`   ✅ ${symbolB} 已授权\n`);
    }

    // 添加流动性
    console.log(`🏊 正在添加流动性...`);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 分钟后过期

    const tx = await router.addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      wallet.address,
      deadline,
      {
        gasLimit: 5000000 // 设置足够的 gas limit
      }
    );

    console.log(`   交易哈希: ${tx.hash}`);
    console.log(`   等待确认...\n`);

    const receipt = await tx.wait();
    console.log(`✅ 流动性添加成功！`);
    console.log(`   区块号: ${receipt.blockNumber}`);
    console.log(`   Gas 使用: ${receipt.gasUsed.toString()}\n`);

    // 获取最终的池子地址
    const finalPairAddress = await factory.getPair(tokenA, tokenB);
    console.log(`🎉 池子地址: ${finalPairAddress}`);
    console.log(`\n✨ 完成！您现在可以在 DEX 界面中看到这个交易对了。`);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    if (error.error) {
      console.error('详细信息:', error.error);
    }
    throw error;
  }
}

// 主函数
async function main() {
  // 从环境变量或配置文件读取参数
  const config = {
    // NBC 链配置示例
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:9944',
    privateKey: process.env.PRIVATE_KEY || '',
    chainId: parseInt(process.env.CHAIN_ID || '1281'),
    
    // Token 地址 - 请根据实际情况修改
    tokenA: process.env.TOKEN_A || '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', // NBC
    tokenB: process.env.TOKEN_B || '0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff', // WBTC
    
    // 数量 - 请根据实际情况修改
    amountA: process.env.AMOUNT_A || '1000',
    amountB: process.env.AMOUNT_B || '0.1',
    
    // 滑点容忍度 (%)
    slippage: parseFloat(process.env.SLIPPAGE || '0.5')
  };

  // 验证必需参数
  if (!config.privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    console.log('\n使用方法:');
    console.log('  PRIVATE_KEY=your_private_key TOKEN_A=0x... TOKEN_B=0x... AMOUNT_A=100 AMOUNT_B=100 node scripts/createPool.js');
    process.exit(1);
  }

  await createPool(config);
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createPool };
