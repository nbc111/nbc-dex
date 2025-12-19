// 在浏览器控制台运行此脚本来检查 React 状态
// 需要在 Swap 页面运行

(function() {
    console.log('🔍 检查 Swap 页面 React 状态...\n');
    
    // 等待 React DevTools 或直接检查
    const checkState = () => {
        // 尝试从 window 获取 React 相关信息
        const reactFiber = document.querySelector('#swap-page')?._reactInternalFiber ||
                          document.querySelector('#swap-page')?._reactInternalInstance;
        
        if (!reactFiber) {
            console.log('⚠️ 无法直接访问 React 状态');
            console.log('请使用 React DevTools 扩展来检查状态');
            console.log('\n或者尝试以下方法：');
            console.log('1. 安装 React DevTools 扩展');
            console.log('2. 打开 Swap 页面');
            console.log('3. 在 React DevTools 中找到 Swap 组件');
            console.log('4. 检查以下状态：');
            console.log('   - v2Trade: 应该是 Trade 对象');
            console.log('   - allowedPairs: 应该包含至少一个 Pair');
            console.log('   - pairState: 应该是 PairState.EXISTS');
            return;
        }
        
        console.log('✅ 找到 React 组件');
    };
    
    // 检查 Multicall Redux 状态
    const checkReduxState = () => {
        try {
            // 尝试从 localStorage 读取 Redux 状态
            const reduxState = localStorage.getItem('redux_localstorage_simple_multicall');
            if (reduxState) {
                const parsed = JSON.parse(reduxState);
                console.log('Multicall Redux 状态:', parsed);
            } else {
                console.log('未找到 Multicall Redux 状态');
            }
        } catch (e) {
            console.log('无法读取 Redux 状态:', e.message);
        }
    };
    
    // 检查交易对地址计算
    const checkPairAddress = async () => {
        console.log('\n=== 验证交易对地址计算 ===');
        
        const factory = '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793';
        const wdev = '0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC';
        const eth = '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3';
        const initCodeHash = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';
        const actualPair = '0x28fb030cabb1ee0ca181f23f7004a38d301570bf';
        
        if (typeof ethers === 'undefined') {
            console.log('⚠️ 需要加载 ethers.js');
            return;
        }
        
        // 排序 tokens (sortsBefore 逻辑)
        const wdevLower = wdev.toLowerCase();
        const ethLower = eth.toLowerCase();
        const token0 = wdevLower < ethLower ? wdev : eth;
        const token1 = wdevLower < ethLower ? eth : wdev;
        
        console.log(`Token0: ${token0}`);
        console.log(`Token1: ${token1}`);
        
        const salt = ethers.utils.solidityKeccak256(
            ['address', 'address'],
            [token0, token1]
        );
        
        const calculated = ethers.utils.getCreate2Address(
            factory,
            salt,
            initCodeHash
        );
        
        console.log(`计算的地址: ${calculated}`);
        console.log(`实际地址: ${actualPair}`);
        console.log(`匹配: ${calculated.toLowerCase() === actualPair.toLowerCase() ? '✅' : '❌'}`);
    };
    
    // 运行所有检查
    checkState();
    checkReduxState();
    
    if (typeof window.ethereum !== 'undefined') {
        checkPairAddress();
    } else {
        console.log('\n⚠️ 请连接 MetaMask 以验证交易对地址');
    }
    
    console.log('\n=== 建议的解决方案 ===');
    console.log('1. 硬刷新页面 (Ctrl+Shift+R)');
    console.log('2. 清除浏览器缓存');
    console.log('3. 在 Swap 页面：');
    console.log('   - 先选择其他代币（如 BTC）');
    console.log('   - 再切回 NBC/ETH');
    console.log('   - 这样会触发状态更新');
    console.log('4. 等待 5-10 秒让 Multicall 同步数据');
    console.log('5. 检查浏览器控制台是否有错误信息');
})();

