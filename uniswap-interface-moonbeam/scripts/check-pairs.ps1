# NBC 交易对查询脚本
# 用于快速检查交易对是否在链上存在

param(
    [string]$RpcUrl = "http://localhost:8545"  # 默认 RPC URL，可以通过参数修改
)

Write-Host "🔍 NBC 交易对查询工具" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# 检查是否安装了 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "   下载地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 检查是否安装了 ethers
Write-Host "📦 检查依赖..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if (-not $packageJson.dependencies.ethers -and -not $packageJson.devDependencies.ethers) {
    Write-Host "⚠️  未安装 ethers，正在安装..." -ForegroundColor Yellow
    npm install --save-dev ethers
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 安装 ethers 失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ ethers 安装成功" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 RPC URL: $RpcUrl" -ForegroundColor Cyan
Write-Host "🏭 Factory: 0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793" -ForegroundColor Cyan
Write-Host ""

# 创建临时查询脚本
$tempScript = @"
const { ethers } = require('ethers');

const RPC_URL = '$RpcUrl';
const FACTORY = '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793';
const PAIRS = [
  { name: 'NBC/ETH', tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', tokenB: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3' },
  { name: 'NBC/SOL', tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', tokenB: '0xd5eeccc885ef850d90ae40e716c3dfce5c3d4c81' },
  { name: 'NBC/BNB', tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', tokenB: '0x9c43237490272bfdd2f1d1ca0b34f20b1a3c9f5c' },
  { name: 'NBC/XRP', tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', tokenB: '0x48e1772534fabbdcade9ca4005e5ee8bf4190093' }
];

const FACTORY_ABI = ['function getPair(address,address) view returns (address)'];
const PAIR_ABI = ['function getReserves() view returns (uint112,uint112,uint32)', 'function totalSupply() view returns (uint256)'];

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log('✅ 已连接到链，ChainId:', network.chainId);
    console.log('');
  } catch (error) {
    console.error('❌ 无法连接到 RPC:', error.message);
    process.exit(1);
  }
  
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);
  
  let existCount = 0;
  let notExistCount = 0;
  
  for (const pair of PAIRS) {
    try {
      const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
      
      if (pairAddress === ethers.constants.AddressZero) {
        console.log('❌', pair.name, '- 不存在');
        notExistCount++;
      } else {
        const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [reserve0, reserve1] = await pairContract.getReserves();
        const totalSupply = await pairContract.totalSupply();
        
        console.log('✅', pair.name, '- 已存在');
        console.log('   地址:', pairAddress);
        console.log('   储备量:', ethers.utils.formatEther(reserve0), '/', ethers.utils.formatEther(reserve1));
        console.log('   LP供应:', ethers.utils.formatEther(totalSupply));
        console.log('');
        existCount++;
      }
    } catch (error) {
      console.error('⚠️ ', pair.name, '- 查询失败:', error.message);
    }
  }
  
  console.log('');
  console.log('=' * 60);
  console.log('📊 统计:');
  console.log('   已存在:', existCount, '个');
  console.log('   不存在:', notExistCount, '个');
  console.log('=' * 60);
  
  if (notExistCount > 0) {
    console.log('');
    console.log('💡 提示: 不存在的交易对需要先添加流动性来创建');
    console.log('   1. 启动前端: npm start');
    console.log('   2. 访问 Pool 页面');
    console.log('   3. 点击 Add Liquidity');
  }
}

main().catch(console.error);
"@

# 保存临时脚本
$tempScript | Out-File -FilePath "scripts/temp-check.js" -Encoding UTF8

Write-Host "🔄 正在查询交易对..." -ForegroundColor Cyan
Write-Host ""

# 运行查询
node scripts/temp-check.js

# 清理临时文件
Remove-Item "scripts/temp-check.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ 查询完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📖 详细文档请查看: HOW_TO_CHECK_PAIRS.md" -ForegroundColor Yellow
