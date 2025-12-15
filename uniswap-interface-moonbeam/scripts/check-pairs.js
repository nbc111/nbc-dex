/**
 * 查询链上交易对脚本
 * 用于检查 NBC 交易对是否已在链上创建
 */

const { ethers } = require('ethers');

// NBC 链配置
const NBC_RPC_URL = 'YOUR_NBC_RPC_URL'; // 替换为您的 NBC 链 RPC 地址
const FACTORY_ADDRESS = '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793';

// 代币地址
const TOKENS = {
  NBC: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa',
  ETH: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
  SOL: '0xd5eeccc885ef850d90ae40e716c3dfce5c3d4c81',
  BNB: '0x9c43237490272bfdd2f1d1ca0b34f20b1a3c9f5c',
  XRP: '0x48e1772534fabbdcade9ca4005e5ee8bf4190093'
};

// Uniswap V2 Factory ABI (只需要 getPair 函数)
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)'
];

// Uniswap V2 Pair ABI
const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)'
];

// ERC20 ABI
const ERC20_ABI = [
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address owner) external view returns (uint256)'
];

async function checkPair(provider, tokenAAddress, tokenBAddress, tokenASymbol, tokenBSymbol) {
  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    // 查询交易对地址
    const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
    
    if (pairAddress === ethers.constants.AddressZero) {
      console.log(`\n❌ ${tokenASymbol}/${tokenBSymbol} 交易对不存在`);
      console.log(`   需要先创建流动性池`);
      return null;
    }
    
    console.log(`\n✅ ${tokenASymbol}/${tokenBSymbol} 交易对已存在`);
    console.log(`   Pair 地址: ${pairAddress}`);
    
    // 获取交易对详细信息
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const totalSupply = await pair.totalSupply();
    
    console.log(`   Reserve0: ${ethers.utils.formatUnits(reserve0, 18)}`);
    console.log(`   Reserve1: ${ethers.utils.formatUnits(reserve1, 18)}`);
    console.log(`   LP Token 总供应量: ${ethers.utils.formatUnits(totalSupply, 18)}`);
    
    return pairAddress;
  } catch (error) {
    console.error(`\n❌ 查询 ${tokenASymbol}/${tokenBSymbol} 失败:`, error.message);
    return null;
  }
}

async function getAllPairs(provider) {
  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const pairsLength = await factory.allPairsLength();
    
    console.log(`\n📊 Factory 中共有 ${pairsLength} 个交易对\n`);
    
    if (pairsLength.toNumber() === 0) {
      console.log('⚠️  当前没有任何交易对，需要先创建流动性池');
      return;
    }
    
    console.log('所有交易对列表：');
    for (let i = 0; i < pairsLength; i++) {
      const pairAddress = await factory.allPairs(i);
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      
      const token0Address = await pair.token0();
      const token1Address = await pair.token1();
      
      const token0 = new ethers.Contract(token0Address, ERC20_ABI, provider);
      const token1 = new ethers.Contract(token1Address, ERC20_ABI, provider);
      
      const symbol0 = await token0.symbol();
      const symbol1 = await token1.symbol();
      
      console.log(`${i + 1}. ${symbol0}/${symbol1} - ${pairAddress}`);
    }
  } catch (error) {
    console.error('获取所有交易对失败:', error.message);
  }
}

async function main() {
  console.log('🔍 开始查询 NBC 链上的交易对...\n');
  console.log(`Factory 地址: ${FACTORY_ADDRESS}`);
  console.log(`RPC URL: ${NBC_RPC_URL}\n`);
  
  // 连接到 NBC 链
  const provider = new ethers.providers.JsonRpcProvider(NBC_RPC_URL);
  
  // 检查网络连接
  try {
    const network = await provider.getNetwork();
    console.log(`✅ 已连接到网络，ChainId: ${network.chainId}\n`);
  } catch (error) {
    console.error('❌ 无法连接到 NBC 链，请检查 RPC URL');
    process.exit(1);
  }
  
  console.log('='.repeat(60));
  console.log('检查 NBC 交易对');
  console.log('='.repeat(60));
  
  // 检查每个交易对
  await checkPair(provider, TOKENS.NBC, TOKENS.ETH, 'NBC', 'ETH');
  await checkPair(provider, TOKENS.NBC, TOKENS.SOL, 'NBC', 'SOL');
  await checkPair(provider, TOKENS.NBC, TOKENS.BNB, 'NBC', 'BNB');
  await checkPair(provider, TOKENS.NBC, TOKENS.XRP, 'NBC', 'XRP');
  
  console.log('\n' + '='.repeat(60));
  console.log('所有交易对概览');
  console.log('='.repeat(60));
  
  // 获取所有交易对
  await getAllPairs(provider);
  
  console.log('\n✅ 查询完成！');
}

// 运行脚本
main().catch(console.error);
