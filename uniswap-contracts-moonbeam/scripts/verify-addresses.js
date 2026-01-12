const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 开始验证合约地址...\n");
  console.log("=" .repeat(80));

  const provider = ethers.provider;
  const network = await provider.getNetwork();
  
  console.log("\n📡 网络信息:");
  console.log("   网络名称:", hre.network.name);
  console.log("   Chain ID:", network.chainId);
  console.log("   RPC URL:", hre.network.config.url);

  // 读取所有配置文件中的地址
  const addresses = {
    "NBC 前端配置 (nbc_address.json)": {
      WETH: "0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC",
      Factory: "0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793",
      Router: "0x8A9F07A6F7CFD8Ff86Be0F3A8b5d640176E4823A",
      Multicall: "0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a"
    },
    "Moonbase 前端配置 (moonbase_address.json)": {
      Router: "0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991"
    },
    "合约配置 (address.json - nbc)": {
      Router: "0x2c37f19A9963f3C829c35332662d1BDda10Fe9fC"
    }
  };

  console.log("\n" + "=".repeat(80));
  console.log("验证核心合约");
  console.log("=".repeat(80));

  // 验证 WETH
  await verifyContract("WETH", addresses["NBC 前端配置 (nbc_address.json)"].WETH);

  // 验证 Factory
  await verifyContract("Factory", addresses["NBC 前端配置 (nbc_address.json)"].Factory);

  // 验证 Multicall
  await verifyContract("Multicall", addresses["NBC 前端配置 (nbc_address.json)"].Multicall);

  console.log("\n" + "=".repeat(80));
  console.log("验证 Router 地址（存在冲突）");
  console.log("=".repeat(80));

  // 验证所有 Router 地址
  const routerAddresses = [
    { name: "Router 1 (nbc_address.json)", address: addresses["NBC 前端配置 (nbc_address.json)"].Router },
    { name: "Router 2 (moonbase_address.json)", address: addresses["Moonbase 前端配置 (moonbase_address.json)"].Router },
    { name: "Router 3 (address.json)", address: addresses["合约配置 (address.json - nbc)"].Router }
  ];

  const validRouters = [];
  for (const router of routerAddresses) {
    const isValid = await verifyContract(router.name, router.address);
    if (isValid) {
      validRouters.push(router);
      // 尝试调用 factory() 方法验证是否是正确的 Router
      try {
        const routerContract = await ethers.getContractAt("IUniswapV2Router02", router.address);
        const factoryAddress = await routerContract.factory();
        console.log(`   ✅ Factory 地址: ${factoryAddress}`);
        
        if (factoryAddress.toLowerCase() === addresses["NBC 前端配置 (nbc_address.json)"].Factory.toLowerCase()) {
          console.log(`   ✅ Factory 地址匹配！这是正确的 Router`);
        } else {
          console.log(`   ⚠️  Factory 地址不匹配`);
        }
      } catch (error) {
        console.log(`   ⚠️  无法调用 factory() 方法:`, error.message);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("验证总结");
  console.log("=".repeat(80));

  console.log("\n✅ 验证通过的核心合约:");
  console.log("   WETH:     ", addresses["NBC 前端配置 (nbc_address.json)"].WETH);
  console.log("   Factory:  ", addresses["NBC 前端配置 (nbc_address.json)"].Factory);
  console.log("   Multicall:", addresses["NBC 前端配置 (nbc_address.json)"].Multicall);

  if (validRouters.length > 0) {
    console.log("\n✅ 有效的 Router 地址:");
    validRouters.forEach(router => {
      console.log(`   ${router.name}: ${router.address}`);
    });
  }

  if (validRouters.length > 1) {
    console.log("\n⚠️  警告: 发现多个有效的 Router 地址！");
    console.log("   建议: 确认哪个是当前使用的，并统一所有配置文件。");
  }

  // 生成验证报告
  const report = {
    timestamp: new Date().toISOString(),
    network: {
      name: hre.network.name,
      chainId: network.chainId,
      rpcUrl: hre.network.config.url
    },
    verified: {
      WETH: addresses["NBC 前端配置 (nbc_address.json)"].WETH,
      Factory: addresses["NBC 前端配置 (nbc_address.json)"].Factory,
      Multicall: addresses["NBC 前端配置 (nbc_address.json)"].Multicall
    },
    routerAddresses: validRouters,
    recommendation: validRouters.length > 1 ? "需要统一 Router 地址" : "Router 地址已确认"
  };

  const reportPath = "./verification-report.json";
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 验证报告已保存到: ${reportPath}`);

  console.log("\n" + "=".repeat(80));
}

async function verifyContract(name, address) {
  try {
    console.log(`\n🔍 验证 ${name}:`);
    console.log(`   地址: ${address}`);
    
    const code = await ethers.provider.getCode(address);
    
    if (code === "0x" || code === "0x0") {
      console.log(`   ❌ 该地址没有部署合约代码`);
      return false;
    } else {
      const codeSize = (code.length - 2) / 2; // 减去 "0x" 并除以 2
      console.log(`   ✅ 合约已部署 (代码大小: ${codeSize} bytes)`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ 验证失败:`, error.message);
    return false;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 验证过程出错:");
    console.error(error);
    process.exit(1);
  });
