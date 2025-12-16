import { ChainId, Currency, DEV, Token } from 'moonbeamswap'
import { getNativeCurrencySymbol } from './index'

export function currencyId(currency: Currency, chainId?: ChainId): string {
  if (currency === DEV) {
    return chainId ? getNativeCurrencySymbol(chainId) : 'ETH'
  }
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
