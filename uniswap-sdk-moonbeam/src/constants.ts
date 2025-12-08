import JSBI from 'jsbi'
import { factory } from './moonbase_address.json'

// exports for external consumption
export type BigintIsh = JSBI | bigint | string

export enum ChainId {
  MAINNET = 1,
  STANDALONE = 1281,
  MOONROCK = 1286,
  MOONBASE = 1287,
  MOONSHADOW = 1288,
  // 添加您的自有网络 Chain ID
  // CUSTOM_NETWORK = YOUR_CHAIN_ID
}

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export const FACTORY_ADDRESS: { [key: string]: string } = {
  [ChainId.STANDALONE]: '0xf0616CCDa274b6DbFa645d70f8Dc0f617707E793',
  [ChainId.MOONROCK]: factory,
  [ChainId.MOONBASE]: factory,
  [ChainId.MOONSHADOW]: factory
}

export const INIT_CODE_HASH = '0x01429e880a7972ebfbba904a5bbe32a816e78273e4b38ffa6bdeaebce8adba7c'

export const INIT_CODE_HASH_MAP: { [key: string]: string } = {
  [ChainId.STANDALONE]: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  [ChainId.MOONROCK]: INIT_CODE_HASH,
  [ChainId.MOONBASE]: INIT_CODE_HASH,
  [ChainId.MOONSHADOW]: INIT_CODE_HASH
}

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256'
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
}
