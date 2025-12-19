// 在 Swap 页面控制台运行此代码来修复状态
// 复制整个文件内容到浏览器控制台运行

(function fixSwapState() {
    console.log('🔧 开始修复 Swap 状态...\n');
    
    // 1. 清除 Multicall 缓存
    console.log('1. 清除 Multicall 缓存...');
    try {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        keys.forEach(key => {
            if (key.includes('multicall') || key.includes('redux')) {
                localStorage.removeItem(key);
                cleared++;
            }
        });
        console.log(`   ✅ 已清除 ${cleared} 个缓存项`);
    } catch (error) {
        console.log(`   ❌ 错误: ${error.message}`);
    }
    
    // 2. 检查交易对数据
    console.log('\n2. 检查交易对数据...');
    const pairAddress = '0x28fb030cabb1ee0ca181f23f7004a38d301570bf';
    const multicallData = localStorage.getItem('redux_localstorage_simple_multicall');
    
    if (multicallData) {
        const parsed = JSON.parse(multicallData);
        const pairKey = Object.keys(parsed).find(key => 
            key.includes(pairAddress.toLowerCase())
        );
        
        if (pairKey) {
            console.log(`   ✅ 找到交易对数据: ${pairKey.substring(0, 50)}...`);
        } else {
            console.log('   ⚠️ 未找到交易对数据，需要重新获取');
        }
    } else {
        console.log('   ⚠️ 未找到 Multicall Redux 状态');
    }
    
    // 3. 触发输入框事件（强制 React 更新）
    console.log('\n3. 触发 React 状态更新...');
    const swapInput = document.querySelector('#swap-currency-input input.token-amount-input');
    const swapOutput = document.querySelector('#swap-currency-output input.token-amount-input');
    
    if (swapInput) {
        const currentValue = swapInput.value;
        // 触发输入事件
        swapInput.dispatchEvent(new Event('input', { bubbles: true }));
        swapInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('   ✅ 已触发输入框事件');
    } else {
        console.log('   ⚠️ 未找到输入框');
    }
    
    // 4. 等待并检查
    console.log('\n4. 等待 3 秒后检查状态...');
    setTimeout(() => {
        console.log('   ⏳ 等待 Multicall 数据同步...');
        console.log('\n建议操作：');
        console.log('   1. 在 Swap 页面切换代币（先选 BTC，再选回 NBC/ETH）');
        console.log('   2. 等待 5-10 秒');
        console.log('   3. 如果仍不行，硬刷新页面 (Ctrl+Shift+R)');
        console.log('   4. 清除浏览器缓存后重试');
    }, 3000);
    
    console.log('\n✅ 修复脚本执行完成');
})();

