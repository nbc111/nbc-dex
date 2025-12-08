# Classic DEX Example forked from Sushiswap-Classic-Exchange (Uniswap)

Forked from [sushiswap/sushiswap-classic-exchange](https://github.com/sushiswap/sushiswap-classic-exchange), and updated for both a Moonbase Standalone Node and Moonbase Alpha.

## Moonbase Standalone Addresses

If you use the [following repository](https://github.com/albertov19/uniswap-contracts-moonbeam): your contracts should have the following addresses:

```
      "WETH": "0xC2Bf5F29a4384b1aB0C063e1c666f02121B6084a",
      "factory": "0x5c4242beB94dE30b922f57241f1D02f36e906915",
      "router": "0x42e2EE7Ba8975c473157634Ac2AF4098190fc741",
      "multicall": "0xF8cef78E923919054037a1D03662bBD884fF4edf",
      "init_code_hash": "0x01429e880a7972ebfbba904a5bbe32a816e78273e4b38ffa6bdeaebce8adba7c",
      "tok1": "0xe573BCA813c741229ffB2488F7856C6cAa841041",
      "tok2": "0xBb0CC0fb3e0c06725c67167501f850B4900D6DB5"
```

## Moonbase Alpha Addresses

To make the interface work with your Moonbase Alpha deployment, you need to modify the `./src/moonbase_address.json`. Also make sure that you modify the addresses in the SDK repo.

On Moonbase Alpha, these are the following addresses:

```
      "WETH": "0x1c94B4e46D35c27Ed241c8e9E2c91a7FB443CEdc",
      "Factory": "0x3584446E08A4433f3b57d0D53A4338A282fB570D",
      "Router": "0x56a82ED340bB2CFa87777b1C42adE7F687A2196a",
      "multicall": "0xE3701304F4d224B738Dc7a22f216884B815aef12",
      "init_code_hash": "0x01429e880a7972ebfbba904a5bbe32a816e78273e4b38ffa6bdeaebce8adba7c",
      "tok1": "0x825458b871FC6582d94c6d2BCe887897DFD9EDA2",
      "tok2": "0xF8f525327D199F340D60d4b3ee847B5d49a28E3C"
```

## Build

Install packages:

```
npm i
```

**Note**: If you encounter TypeScript version conflicts, the project includes a `.npmrc` file that automatically uses `--legacy-peer-deps`. Alternatively, you can run:

```
npm i --legacy-peer-deps
```

## Configuration

### NBC Network (Chain ID 1281)

To connect to the NBC network, copy the `.env.nbc` file to `.env`:

```bash
copy .env.nbc .env
```

Or create a `.env` file with the following content:

```env
REACT_APP_CHAIN_ID="1281"
REACT_APP_NETWORK_URL="https://rpc.nbcex.com"
```

The NBC network contracts are already configured in `nbc_address.json`:
- Factory: `0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793`
- Router: `0x3d53f590c82a61f85e6B1f0813e509AEAA0b4991`
- WETH: `0xFA3956c0620488E2ccdfc48BB02baeB8BDa286fC`
- Multicall: `0xF396bb272c5f11EF5E172bAEEC49e9cC895c589a`
- Init Code Hash: `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`

### Other Networks

For Moonbase Alpha or other networks, modify the `.env` file with the appropriate `REACT_APP_CHAIN_ID` and `REACT_APP_NETWORK_URL`.

Run:

```
npm start
```

Or use the development script (recommended, fixes Node.js v20 compatibility issues):

```powershell
.\start-dev.ps1
