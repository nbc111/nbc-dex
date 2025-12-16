const { createPool } = require('./createPool');

/**
 * 批量创建流动性池子
 * 这个脚本会按顺序创建多个流动性池
 */

// 定义要创建的池子列表
const POOLS = [
  {
    name: 'NBC/WBTC',
    tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', // NBC
    tokenB: '0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff', // WBTC
    amountA: '10000',
    amountB: '1',
    slippage: 0.5
  },
  {
    name: 'NBC/WETH',
    tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', // NBC
    tokenB: '0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95', // WETH
    amountA: '10000',
    amountB: '5',
    slippage: 0.5
  },
  {
    name: 'NBC/WSOL',
    tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', // NBC
    tokenB: '0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325', // WSOL
    amountA: '10000',
    amountB: '100',
    slippage: 0.5
  },
  {
    name: 'NBC/WBNB',
    tokenA: '0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa', // NBC
    tokenB: '0x89ce62e131e0d18f9f7162efe63bd6034f72c7a8a79cdb90106285bd2f70f811', // WBNB
    amountA: '10000',
    amountB: '20',
    slippage: 0.5
  },
  {
    name: 'WBTC/WETH',
    tokenA: '0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff', // WBTC
    tokenB: '0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95', // WETH
    amountA: '1',
    amountB: '15',
    slippage: 0.5
  },
  {
    name: 'WETH/WSOL',
    tokenA: '0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95', // WETH
    tokenB: '0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325', // WSOL
    amountA: '5',
    amountB: '100',
    slippage: 0.5
  }
];

async function main() {
  // 从环境变量读取基础配置
  const baseConfig = {
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:9944',
    privateKey: process.env.PRIVATE_KEY || '',
    chainId: parseInt(process.env.CHAIN_ID || '1281')
  };

  // 验证私钥
  if (!baseConfig.privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    console.log('\n使用方法:');
    console.log('  $env:PRIVATE_KEY="your_private_key"');
    console.log('  node scripts/batchCreatePools.js');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         批量创建流动性池子                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`📋 总共需要创建 ${POOLS.length} 个池子\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  // 逐个创建池子
  for (let i = 0; i < POOLS.length; i++) {
    const pool = POOLS[i];
    console.log('═'.repeat(60));
    console.log(`\n🔄 [${i + 1}/${POOLS.length}] 正在创建池子: ${pool.name}\n`);
    console.log('═'.repeat(60));

    try {
      await createPool({
        ...baseConfig,
        ...pool
      });

      results.push({
        name: pool.name,
        status: 'success',
        error: null
      });
      successCount++;

      console.log(`\n✅ 池子 ${pool.name} 创建成功！\n`);

      // 在池子之间添加延迟，避免 nonce 冲突
      if (i < POOLS.length - 1) {
        console.log('⏳ 等待 5 秒后继续下一个池子...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      results.push({
        name: pool.name,
        status: 'failed',
        error: error.message
      });
      failCount++;

      console.error(`\n❌ 池子 ${pool.name} 创建失败: ${error.message}\n`);
      
      // 询问是否继续
      console.log('⚠️  是否继续创建下一个池子？(按 Ctrl+C 退出)\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 打印总结
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                     执行总结                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 总计: ${POOLS.length} 个池子`);
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${failCount} 个\n`);

  console.log('详细结果:\n');
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.name} - ${result.status}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });

  console.log('\n');
  
  if (failCount > 0) {
    console.log('⚠️  有池子创建失败，请检查错误信息并重试。');
    process.exit(1);
  } else {
    console.log('🎉 所有池子创建成功！');
    process.exit(0);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ 批量创建过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = { POOLS };
