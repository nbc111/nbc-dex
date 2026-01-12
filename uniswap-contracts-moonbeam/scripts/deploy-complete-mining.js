const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 开始部署完整的流动性挖矿系统...\n");
  console.log("=" .repeat(60));

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("\n📝 部署信息:");
  console.log("   账户:", deployer.address);
  console.log("   余额:", ethers.utils.formatEther(await deployer.getBalance()), "NBC");
  console.log("   网络:", hre.network.name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);

  const deploymentResults = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  console.log("\n" + "=".repeat(60));
  console.log("步骤 1/3: 部署NBC奖励代币");
  console.log("=".repeat(60));

  // 部署NBC代币
  const NBCToken = await ethers.getContractFactory("NBCToken");
  const nbcToken = await NBCToken.deploy(
    "NBC Reward Token",                           // 名称
    "NBC",                                        // 符号
    ethers.utils.parseEther("100000000"),        // 初始供应量: 1亿
    ethers.utils.parseEther("1000000000")        // 最大供应量: 10亿
  );

  await nbcToken.deployed();
  console.log("✅ NBC代币部署成功!");
  console.log("   地址:", nbcToken.address);
  console.log("   名称:", await nbcToken.name());
  console.log("   符号:", await nbcToken.symbol());
  console.log("   初始供应:", ethers.utils.formatEther(await nbcToken.totalSupply()), "NBC");
  console.log("   最大供应:", ethers.utils.formatEther(await nbcToken.maxSupply()), "NBC");

  deploymentResults.contracts.nbcToken = {
    address: nbcToken.address,
    name: await nbcToken.name(),
    symbol: await nbcToken.symbol(),
    totalSupply: ethers.utils.formatEther(await nbcToken.totalSupply()),
    maxSupply: ethers.utils.formatEther(await nbcToken.maxSupply())
  };

  // 等待确认
  console.log("\n⏳ 等待区块确认...");
  await nbcToken.deployTransaction.wait(3);
  console.log("✅ 确认完成!");

  console.log("\n" + "=".repeat(60));
  console.log("步骤 2/3: 部署流动性挖矿合约");
  console.log("=".repeat(60));

  // 配置参数
  const NBC_PER_BLOCK = ethers.utils.parseEther("10");  // 每区块10 NBC
  const currentBlock = await ethers.provider.getBlockNumber();
  const START_BLOCK = currentBlock + 100;                // 100个区块后开始

  console.log("\n⚙️  挖矿参数:");
  console.log("   每区块奖励:", ethers.utils.formatEther(NBC_PER_BLOCK), "NBC");
  console.log("   当前区块:", currentBlock);
  console.log("   开始区块:", START_BLOCK);
  console.log("   预计开始时间: ~", Math.round((START_BLOCK - currentBlock) * 12 / 60), "分钟后");

  // 部署LiquidityMining合约
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    nbcToken.address,
    NBC_PER_BLOCK,
    START_BLOCK
  );

  await liquidityMining.deployed();
  console.log("\n✅ LiquidityMining合约部署成功!");
  console.log("   地址:", liquidityMining.address);

  deploymentResults.contracts.liquidityMining = {
    address: liquidityMining.address,
    nbcPerBlock: ethers.utils.formatEther(NBC_PER_BLOCK),
    startBlock: START_BLOCK,
    currentBlock: currentBlock
  };

  // 等待确认
  console.log("\n⏳ 等待区块确认...");
  await liquidityMining.deployTransaction.wait(3);
  console.log("✅ 确认完成!");

  console.log("\n" + "=".repeat(60));
  console.log("步骤 3/3: 初始化挖矿合约");
  console.log("=".repeat(60));

  // 计算需要的NBC数量 (1年的奖励)
  const BLOCKS_PER_YEAR = Math.floor(365 * 24 * 60 * 60 / 12);  // 假设12秒一个区块
  const NBC_FOR_ONE_YEAR = NBC_PER_BLOCK.mul(BLOCKS_PER_YEAR);

  console.log("\n💰 转账NBC代币到挖矿合约:");
  console.log("   1年区块数:", BLOCKS_PER_YEAR.toLocaleString());
  console.log("   1年总奖励:", ethers.utils.formatEther(NBC_FOR_ONE_YEAR), "NBC");

  // 转账NBC到挖矿合约
  const transferTx = await nbcToken.transfer(liquidityMining.address, NBC_FOR_ONE_YEAR);
  await transferTx.wait();
  
  const miningBalance = await nbcToken.balanceOf(liquidityMining.address);
  console.log("✅ 转账成功!");
  console.log("   挖矿合约余额:", ethers.utils.formatEther(miningBalance), "NBC");

  deploymentResults.initialization = {
    nbcTransferred: ethers.utils.formatEther(NBC_FOR_ONE_YEAR),
    miningContractBalance: ethers.utils.formatEther(miningBalance),
    blocksPerYear: BLOCKS_PER_YEAR
  };

  console.log("\n" + "=".repeat(60));
  console.log("🎉 部署完成!");
  console.log("=".repeat(60));

  // 保存部署信息到文件
  const outputPath = `./deployments/mining-${hre.network.name}-${Date.now()}.json`;
  fs.mkdirSync('./deployments', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentResults, null, 2));
  console.log("\n📄 部署信息已保存到:", outputPath);

  // 显示摘要
  console.log("\n📋 部署摘要:");
  console.log("━".repeat(60));
  console.log("NBC代币地址:        ", nbcToken.address);
  console.log("挖矿合约地址:        ", liquidityMining.address);
  console.log("每区块奖励:          ", ethers.utils.formatEther(NBC_PER_BLOCK), "NBC");
  console.log("开始区块:            ", START_BLOCK);
  console.log("挖矿合约NBC余额:     ", ethers.utils.formatEther(miningBalance), "NBC");
  console.log("━".repeat(60));

  console.log("\n📝 下一步操作:");
  console.log("━".repeat(60));
  console.log("1️⃣  添加LP池子:");
  console.log("   const mining = await ethers.getContractAt('LiquidityMining', '" + liquidityMining.address + "');");
  console.log("   await mining.add(100, 'LP_TOKEN_ADDRESS', true);");
  console.log("");
  console.log("2️⃣  用户使用流程:");
  console.log("   a. 在Uniswap添加流动性获得LP代币");
  console.log("   b. 授权LP代币给挖矿合约");
  console.log("   c. 质押LP代币开始挖矿");
  console.log("   d. 随时领取NBC奖励");
  console.log("");
  console.log("3️⃣  管理操作:");
  console.log("   - 调整奖励速率: updateNbcPerBlock()");
  console.log("   - 调整池子权重: set()");
  console.log("   - 添加新池子: add()");
  console.log("━".repeat(60));

  console.log("\n💡 重要提示:");
  console.log("━".repeat(60));
  console.log("✅ 挖矿合约已充值", ethers.utils.formatEther(miningBalance), "NBC");
  console.log("✅ 可支持约1年的挖矿奖励");
  console.log("⚠️  请在主网部署前进行充分测试");
  console.log("⚠️  建议进行专业的安全审计");
  console.log("⚠️  定期监控合约NBC余额");
  console.log("━".repeat(60));

  console.log("\n🔗 验证合约 (可选):");
  console.log("━".repeat(60));
  console.log("npx hardhat verify --network", hre.network.name, nbcToken.address, 
    '"NBC Reward Token"', '"NBC"',
    '"' + ethers.utils.parseEther("100000000").toString() + '"',
    '"' + ethers.utils.parseEther("1000000000").toString() + '"');
  console.log("");
  console.log("npx hardhat verify --network", hre.network.name, liquidityMining.address,
    nbcToken.address,
    '"' + NBC_PER_BLOCK.toString() + '"',
    START_BLOCK);
  console.log("━".repeat(60));

  console.log("\n✨ 全部完成! 祝您使用愉快! ✨\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:");
    console.error(error);
    process.exit(1);
  });
