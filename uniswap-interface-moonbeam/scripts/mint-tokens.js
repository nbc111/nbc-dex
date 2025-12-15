const { ethers } = require('ethers');

// 配置
const RPC_URL = 'https://rpc.nbcex.com';
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // ⚠️ 请替换为你的私钥
const YOUR_WALLET_ADDRESS = '0x1a0370ae087a089ec5895a0744e3b750993a24a8'; // 你的钱包地址

// 代币合约地址
const TOKENS = {
    NBC: '0xfE473265296e058fd1999cFf7E4536F51f5a1Fe6',
    BTC: '0x5EaA2c6ae3bFf47D2188B64F743Ec777733a80ac',
    ETH: '0x934EbeB6D7D3821B604A5D10F80619d5bcBe49C3',
    USDT: '0xfd1508502696d0e1910ed850c6236d965cc4db11',
};

// ERC20 ABI（包含 mint 函数）
const ERC20_ABI = [
    'function mint(address to, uint256 amount) public',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
];

async function mintTokens(tokenAddress, amount) {
    try {
        // 连接到 NBC 网络
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        // 连接到代币合约
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        
        // 获取代币信息
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        
        console.log(`\n🪙 Minting ${symbol}...`);
        console.log(`   Amount: ${amount} ${symbol}`);
        console.log(`   To: ${YOUR_WALLET_ADDRESS}`);
        
        // 转换金额（考虑 decimals）
        const amountWithDecimals = ethers.utils.parseUnits(amount.toString(), decimals);
        
        // 调用 mint 函数
        const tx = await tokenContract.mint(YOUR_WALLET_ADDRESS, amountWithDecimals);
        console.log(`   Transaction hash: ${tx.hash}`);
        console.log(`   Waiting for confirmation...`);
        
        // 等待交易确认
        const receipt = await tx.wait();
        console.log(`   ✅ Minted successfully! Block: ${receipt.blockNumber}`);
        
        // 检查余额
        const balance = await tokenContract.balanceOf(YOUR_WALLET_ADDRESS);
        const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
        console.log(`   💰 New balance: ${balanceFormatted} ${symbol}`);
        
        return receipt;
    } catch (error) {
        console.error(`   ❌ Error minting tokens:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('=== 🏭 NBC Token Minting Tool ===\n');
    console.log(`Network: NBC (Chain ID 1281)`);
    console.log(`RPC: ${RPC_URL}`);
    console.log(`Wallet: ${YOUR_WALLET_ADDRESS}\n`);
    
    // 铸造不同的代币
    const tokensToMint = [
        { address: TOKENS.NBC, amount: 10000 },   // 10,000 NBC
        { address: TOKENS.BTC, amount: 10 },      // 10 BTC
        { address: TOKENS.ETH, amount: 100 },     // 100 ETH
        { address: TOKENS.USDT, amount: 50000 },  // 50,000 USDT
    ];
    
    for (const token of tokensToMint) {
        try {
            await mintTokens(token.address, token.amount);
        } catch (error) {
            console.error(`Failed to mint token at ${token.address}`);
        }
    }
    
    console.log('\n✅ All done!');
}

// 运行脚本
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { mintTokens };
