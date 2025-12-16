/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');

const privateKey = process.env.PRIVKEY;
const privateKeyDev = '0x99b3c12287537e38c90a9219d4cb074a89a16e9cdb20bf85728ebd97c343e342';

module.exports = {
  defaultNetwork: 'hardhat',

  networks: {
    hardhat: {},

    moonbase: {
      url: 'https://rpc.api.moonbase.moonbeam.network',
      accounts: privateKey ? [privateKey] : [],
      chainId: 1287,
    },
    dev: {
      url: 'http://127.0.0.1:9933',
      accounts: [privateKeyDev],
      network_id: '1281',
      chainId: 1281,
    },
    nbc: {
      url: 'http://183.192.65.101:9933',
      accounts: ['0x426231b32113022e22bfc31dc90c15561b6b32ae2dc1d8f0bfaf39c638664a8f'],
      chainId: 1281,
      gasPrice: 1000000000,
      gas: 5000000,
      timeout: 120000,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      moonbaseAlpha: 'key_here',
    },
  },
  paths: {
    sources: './contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 20000,
  },
};