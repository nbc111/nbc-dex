// 脚本：将 tokens.json 中的地址转换为 checksummed 格式
const fs = require('fs');
const path = require('path');
const { getAddress } = require('@ethersproject/address');

const tokensFile = path.join(__dirname, '../src/tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));

console.log('Converting addresses to checksummed format...\n');

let updated = 0;
tokens.tokens.forEach((token, index) => {
  const originalAddress = token.address;
  try {
    const checksummedAddress = getAddress(originalAddress);
    if (originalAddress !== checksummedAddress) {
      console.log(`[${index + 1}] ${token.symbol} (${token.name})`);
      console.log(`  Before: ${originalAddress}`);
      console.log(`  After:  ${checksummedAddress}`);
      token.address = checksummedAddress;
      updated++;
    }
  } catch (error) {
    console.error(`Error converting address for ${token.symbol}: ${error.message}`);
  }
});

if (updated > 0) {
  // 更新版本号
  tokens.version.patch = tokens.version.patch + 1;
  console.log(`\n✓ Updated ${updated} addresses`);
  console.log(`✓ Version updated to ${tokens.version.major}.${tokens.version.minor}.${tokens.version.patch}`);
  
  // 保存文件
  fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2) + '\n', 'utf8');
  console.log('\n✓ File saved successfully!');
} else {
  console.log('\n✓ All addresses are already checksummed!');
}

