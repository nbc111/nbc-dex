# Uniswap V2 on NBC Chain

This repository provides a complete Uniswap V2 DEX implementation for NBC Chain (Chain ID: 1281).

## 🎯 Overview

This is a fork of Uniswap V2 adapted for NBC Chain, providing a decentralized exchange (DEX) interface with full swap, liquidity provision, and pool management capabilities.

**Network**: NBC Chain (Chain ID: 1281)  
**RPC URL**: https://rpc.nbcex.com  
**Block Explorer**: https://www.nbblocks.cc

## 📦 Repository Structure

This repository contains three main components:

### 1. Uniswap Contracts Moonbeam (`uniswap-contracts-moonbeam/`)

Hardhat-based smart contract deployment setup for NBC Chain.

- **Factory**: `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793`
- **Router V02**: `0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991`
- **WETH (Wrapped NBC)**: `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC`
- **Multicall**: `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a`

### 2. Uniswap SDK Moonbeam (`uniswap-sdk-moonbeam/`)

TypeScript SDK for interacting with Uniswap V2 on NBC Chain, including:
- Trade routing and calculation
- Token and pair management
- Price calculations
- Moonbeam/NBC Chain integration

### 3. Uniswap Interface Moonbeam (`uniswap-interface-moonbeam/`)

React-based frontend interface for the DEX, featuring:
- Token swapping
- Liquidity provision and removal
- Pool management
- Wallet integration (MetaMask, WalletConnect)
- Dark/Light theme support

## 🚀 Quick Start

### Prerequisites

- Node.js v16+ (v20+ requires `--openssl-legacy-provider` flag)
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nbc111/nbc-dex.git
   cd nbc-dex
   ```

2. **Install SDK dependencies**:
   ```bash
   cd uniswap-sdk-moonbeam
   npm install
   npm run build
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../uniswap-interface-moonbeam
   npm install
   ```

4. **Configure environment**:
   
   Create a `.env` file in `uniswap-interface-moonbeam/`:
   ```env
   NODE_OPTIONS=--openssl-legacy-provider
   PORT=3001
   REACT_APP_NETWORK_URL=https://rpc.nbcex.com
   REACT_APP_CHAIN_ID=1281
   ```

5. **Start the development server**:
   ```bash
   npm start
   ```

   The interface will be available at `http://localhost:3001`

### Configure MetaMask

Add NBC Chain to MetaMask:

- **Network Name**: NBC Chain
- **RPC URL**: `https://rpc.nbcex.com`
- **Chain ID**: `1281`
- **Currency Symbol**: NBC
- **Block Explorer**: `https://www.nbblocks.cc`

## 📝 Features

- ✅ Token Swapping (Swap)
- ✅ Add Liquidity
- ✅ Remove Liquidity
- ✅ Pool Management
- ✅ Wallet Integration (MetaMask, WalletConnect)
- ✅ Dark/Light Theme
- ✅ Multi-language Support

## 🔧 Development

### Build for Production

```bash
cd uniswap-interface-moonbeam
npm run build
```

### Deploy Contracts

```bash
cd uniswap-contracts-moonbeam
npx hardhat run --network nbc scripts/deploy-factory.js
```

## 📚 Documentation

- [NBC Deployment Guide](NBC_DEPLOYMENT.md) - Detailed deployment instructions
- [Frontend README](uniswap-interface-moonbeam/README.md) - Frontend-specific documentation

## ⚠️ Important Notes

1. **Native Currency**: NBC Chain uses **NBC** as its native currency (not DEV)
2. **Default Chain**: The application is configured to use NBC Chain (1281) by default
3. **Contract Addresses**: All contract addresses are configured for NBC Chain deployment
4. **Security**: This is a demonstration project. Use at your own risk in production.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for demonstration purposes only.

---

**Built for NBC Chain** 🚀
