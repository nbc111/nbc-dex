// 简单诊断脚本 - 不依赖 ethers.js
// 直接在浏览器控制台运行

(async function() {
    console.log('🔍 开始诊断...\n');
    
    const CONFIG = {
        factory: '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793',
        wdev: '0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC',
        eth: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3'
    };
    
    // 检查 MetaMask
    if (typeof window.ethereum === 'undefined') {
        console.error('❌ 请先连接 MetaMask 钱包');
        return;
    }
    
    try {
        // 1. 检查 Chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdInt = parseInt(chainId, 16);
        console.log(`Chain ID: ${chainIdInt} ${chainIdInt === 1281 ? '✅' : '❌'}`);
        
        if (chainIdInt !== 1281) {
            console.error('❌ 请切换到 NBC 链 (1281)');
            return;
        }
        
        // 2. 检查交易对
        console.log('\n=== 检查交易对 ===');
        const getPairData = '0xe6a43905' + 
            CONFIG.wdev.slice(2).padStart(64, '0') +
            CONFIG.eth.slice(2).padStart(64, '0');
        
        const pairResult = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: CONFIG.factory, data: getPairData }, 'latest']
        });
        
        const pairAddress = '0x' + pairResult.slice(-40);
        console.log(`交易对地址: ${pairAddress}`);
        
        if (pairAddress === '0x0000000000000000000000000000000000000000') {
            console.error('❌ 交易对不存在！');
            console.log('请先在 Pool 页面创建 NBC/ETH 流动性池');
            return;
        }
        console.log('✅ 交易对存在');
        
        // 3. 检查 Reserves
        console.log('\n=== 检查 Reserves ===');
        const getReservesData = '0x0902f1ac';
        
        const reservesResult = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: pairAddress, data: getReservesData }, 'latest']
        });
        
        // 解析: uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast
        const reserve0Hex = '0x' + reservesResult.slice(2, 66);
        const reserve1Hex = '0x' + reservesResult.slice(66, 130);
        
        const reserve0 = BigInt(reserve0Hex);
        const reserve1 = BigInt(reserve1Hex);
        
        const reserve0Formatted = Number(reserve0) / 1e18;
        const reserve1Formatted = Number(reserve1) / 1e18;
        
        console.log(`Reserve0: ${reserve0Formatted.toFixed(6)}`);
        console.log(`Reserve1: ${reserve1Formatted.toFixed(6)}`);
        
        if (reserve0 === 0n && reserve1 === 0n) {
            console.error('❌ Reserves 为 0，流动性池为空！');
            console.log('请检查流动性池是否真的添加了流动性');
        } else {
            console.log('✅ Reserves 正常');
        }
        
        // 4. 总结
        console.log('\n=== 诊断总结 ===');
        if (pairAddress !== '0x0000000000000000000000000000000000000000' && 
            reserve0 > 0n && reserve1 > 0n) {
            console.log('✅ 所有检查通过！');
            console.log('\n如果 Swap 页面仍无法计算输出数量，请尝试：');
            console.log('1. 硬刷新页面 (Ctrl+Shift+R)');
            console.log('2. 清除浏览器缓存');
            console.log('3. 等待 5-10 秒让 Multicall 同步数据');
            console.log('4. 在 Swap 页面切换代币（先选其他代币，再切回 NBC/ETH）');
        } else {
            console.log('❌ 发现问题，请根据上面的错误信息修复');
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error(error);
    }
})();

