const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署流动性挖矿合约...\n");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  console.log("💰 账户余额:", ethers.utils.formatEther(await deployer.getBalance()), "NBC\n");

  // NBC代币地址 (需要先部署NBC代币，或使用WNBC)
  // 这里使用WNBC作为示例
  const NBC_TOKEN_ADDRESS = "0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC"; // WNBC地址
  
  // 每个区块的NBC奖励 (例如: 10 NBC per block)
  const NBC_PER_BLOCK = ethers.utils.parseEther("10");
  
  // 开始区块 (当前区块 + 100)
  const currentBlock = await ethers.provider.getBlockNumber();
  const START_BLOCK = currentBlock + 100;

  console.log("⚙️  配置参数:");
  console.log("   NBC代币地址:", NBC_TOKEN_ADDRESS);
  console.log("   每区块奖励:", ethers.utils.formatEther(NBC_PER_BLOCK), "NBC");
  console.log("   开始区块:", START_BLOCK);
  console.log("   当前区块:", currentBlock, "\n");

  // 部署LiquidityMining合约
  console.log("📦 部署 LiquidityMining 合约...");
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    NBC_TOKEN_ADDRESS,
    NBC_PER_BLOCK,
    START_BLOCK
  );

  await liquidityMining.deployed();
  console.log("✅ LiquidityMining 部署成功!");
  console.log("   地址:", liquidityMining.address, "\n");

  // 等待几个区块确认
  console.log("⏳ 等待区块确认...");
  await liquidityMining.deployTransaction.wait(5);
  console.log("✅ 确认完成!\n");

  // 添加示例池子 (需要LP代币地址)
  console.log("📋 可以添加的池子示例:");
  console.log("   使用以下命令添加池子:");
  console.log(`   await liquidityMining.add(100, "LP_TOKEN_ADDRESS", true);`);
  console.log("\n");

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    liquidityMining: liquidityMining.address,
    nbcToken: NBC_TOKEN_ADDRESS,
    nbcPerBlock: ethers.utils.formatEther(NBC_PER_BLOCK),
    startBlock: START_BLOCK,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  console.log("📄 部署信息:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n");

  console.log("🎉 部署完成!");
  console.log("\n📝 下一步操作:");
  console.log("1. 向 LiquidityMining 合约转入足够的NBC代币作为奖励");
  console.log("2. 调用 add() 函数添加LP池子");
  console.log("3. 用户可以质押LP代币开始挖矿");
  console.log("\n💡 重要提示:");
  console.log("   - 确保合约有足够的NBC代币用于奖励分发");
  console.log("   - 建议先在测试网测试完整流程");
  console.log("   - 添加池子时注意设置合理的allocPoint权重");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
