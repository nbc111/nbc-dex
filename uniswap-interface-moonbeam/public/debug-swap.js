// Swap 调试脚本
// 在浏览器控制台运行此脚本来诊断 Swap 问题

(async function debugSwap() {
    console.log('🔍 开始 Swap 诊断...\n');
    
    // 配置
    const CONFIG = {
        chainId: 1281,
        factory: '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793',
        wdev: '0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC',
        eth: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
        multicall: '0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a',
        initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
    };
    
    // 检查 ethers
    if (typeof ethers === 'undefined') {
        console.error('❌ 需要加载 ethers.js 库');
        console.log('请在页面中加载: <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>');
        return;
    }
    
    // 检查 MetaMask
    if (typeof window.ethereum === 'undefined') {
        console.error('❌ 请先连接 MetaMask 钱包');
        return;
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    
    console.log('=== 1. 网络检查 ===');
    console.log(`Chain ID: ${network.chainId} (期望: ${CONFIG.chainId})`);
    if (network.chainId !== CONFIG.chainId) {
        console.error('❌ Chain ID 不匹配！请切换到 NBC 链 (1281)');
        return;
    }
    console.log('✅ Chain ID 正确\n');
    
    // Factory ABI
    const factoryABI = [
        'function getPair(address tokenA, address tokenB) external view returns (address pair)'
    ];
    const factory = new ethers.Contract(CONFIG.factory, factoryABI, provider);
    
    console.log('=== 2. 交易对检查 ===');
    console.log(`Factory: ${CONFIG.factory}`);
    console.log(`WDEV: ${CONFIG.wdev}`);
    console.log(`ETH: ${CONFIG.eth}\n`);
    
    // 检查交易对
    const pairAddress = await factory.getPair(CONFIG.wdev, CONFIG.eth);
    console.log(`交易对地址: ${pairAddress}`);
    
    if (pairAddress === ethers.constants.AddressZero) {
        console.error('❌ 交易对不存在！');
        console.log('请先在 Pool 页面创建 NBC/ETH 流动性池\n');
        return;
    }
    console.log('✅ 交易对存在\n');
    
    // Pair ABI
    const pairABI = [
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() external view returns (address)',
        'function token1() external view returns (address)'
    ];
    const pair = new ethers.Contract(pairAddress, pairABI, provider);
    
    console.log('=== 3. Reserves 检查 ===');
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    
    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    console.log(`Reserve0: ${ethers.utils.formatEther(reserves.reserve0)}`);
    console.log(`Reserve1: ${ethers.utils.formatEther(reserves.reserve1)}`);
    
    if (reserves.reserve0.isZero() && reserves.reserve1.isZero()) {
        console.error('❌ Reserves 为 0，流动性池为空！');
        return;
    }
    console.log('✅ Reserves 正常\n');
    
    // 计算交易对地址（验证）
    console.log('=== 4. 交易对地址验证 ===');
    const token0Addr = token0.toLowerCase();
    const token1Addr = token1.toLowerCase();
    const wdevAddr = CONFIG.wdev.toLowerCase();
    const ethAddr = CONFIG.eth.toLowerCase();
    
    console.log(`Token0 地址: ${token0Addr}`);
    console.log(`Token1 地址: ${token1Addr}`);
    console.log(`WDEV 地址: ${wdevAddr}`);
    console.log(`ETH 地址: ${ethAddr}`);
    
    const isToken0WDEV = token0Addr === wdevAddr;
    const isToken1ETH = token1Addr === ethAddr;
    const isToken0ETH = token0Addr === ethAddr;
    const isToken1WDEV = token1Addr === wdevAddr;
    
    if ((isToken0WDEV && isToken1ETH) || (isToken0ETH && isToken1WDEV)) {
        console.log('✅ 交易对地址匹配\n');
    } else {
        console.warn('⚠️ 交易对地址不匹配！');
        console.log('这可能是问题所在\n');
    }
    
    // 计算 CREATE2 地址
    console.log('=== 5. CREATE2 地址计算 ===');
    const sortedTokens = token0Addr < token1Addr ? [token0Addr, token1Addr] : [token1Addr, token0Addr];
    const salt = ethers.utils.solidityKeccak256(
        ['address', 'address'],
        [sortedTokens[0], sortedTokens[1]]
    );
    const calculatedAddress = ethers.utils.getCreate2Address(
        CONFIG.factory,
        salt,
        CONFIG.initCodeHash
    );
    
    console.log(`计算的地址: ${calculatedAddress}`);
    console.log(`实际地址: ${pairAddress}`);
    
    if (calculatedAddress.toLowerCase() === pairAddress.toLowerCase()) {
        console.log('✅ CREATE2 地址匹配\n');
    } else {
        console.error('❌ CREATE2 地址不匹配！');
        console.log('可能是 Init Code Hash 配置错误\n');
    }
    
    // Multicall 测试
    console.log('=== 6. Multicall 测试 ===');
    const multicallABI = [
        'function aggregate(tuple(address target, bytes callData)[] calls) external returns (uint256 blockNumber, bytes[] returnData)'
    ];
    const multicall = new ethers.Contract(CONFIG.multicall, multicallABI, provider);
    
    const callData = pair.interface.encodeFunctionData('getReserves', []);
    const calls = [[pairAddress, callData]];
    
    try {
        const [blockNumber, returnData] = await multicall.aggregate(calls);
        const decoded = pair.interface.decodeFunctionResult('getReserves', returnData[0]);
        
        console.log(`Multicall 成功`);
        console.log(`区块号: ${blockNumber.toString()}`);
        console.log(`Reserve0: ${ethers.utils.formatEther(decoded.reserve0)}`);
        console.log(`Reserve1: ${ethers.utils.formatEther(decoded.reserve1)}`);
        console.log('✅ Multicall 工作正常\n');
    } catch (error) {
        console.error('❌ Multicall 失败:', error.message);
        console.log('这可能是问题所在\n');
    }
    
    // 总结
    console.log('=== 诊断总结 ===');
    console.log('如果所有检查都通过，但 Swap 页面仍然无法计算输出数量，');
    console.log('可能是以下原因：');
    console.log('1. 浏览器缓存问题 - 尝试硬刷新 (Ctrl+Shift+R)');
    console.log('2. React 状态未更新 - 尝试切换代币或刷新页面');
    console.log('3. Multicall 数据未同步 - 等待几秒钟后重试');
    console.log('4. 交易对地址计算问题 - 检查 SDK 中的 INIT_CODE_HASH_MAP');
    
    // 返回诊断结果
    return {
        pairExists: pairAddress !== ethers.constants.AddressZero,
        reserves: {
            reserve0: reserves.reserve0.toString(),
            reserve1: reserves.reserve1.toString()
        },
        pairAddress,
        calculatedAddress,
        addressMatch: calculatedAddress.toLowerCase() === pairAddress.toLowerCase()
    };
})();

