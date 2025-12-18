import { Currency, CurrencyAmount, Pair, Token, Trade } from 'moonbeamswap'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // Prioritize direct pair first (most important)
            [tokenA, tokenB],
            // For NBC chain, limit base pairs to reduce multicall failures
            // Only check token A against most common bases (WDEV, BTC, ETH, USDT)
            ...(chainId === 1281 
              ? bases.slice(0, 4).map((base): [Token, Token] => [tokenA, base])
              : bases.map((base): [Token, Token] => [tokenA, base])
            ),
            // Only check token B against most common bases
            ...(chainId === 1281
              ? bases.slice(0, 4).map((base): [Token, Token] => [tokenB, base])
              : bases.map((base): [Token, Token] => [tokenB, base])
            ),
            // Skip basePairs for NBC chain to reduce multicall calls
            ...(chainId === 1281 ? [] : basePairs)
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
            .filter(([tokenA, tokenB]) => {
              if (!chainId) return true
              const customBases = CUSTOM_BASES[chainId]
              if (!customBases) return true

              const customBasesA: Token[] | undefined = customBases[tokenA.address]
              const customBasesB: Token[] | undefined = customBases[tokenB.address]

              if (!customBasesA && !customBasesB) return true

              if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false
              if (customBasesB && !customBasesB.find(base => tokenA.equals(base))) return false

              return true
            })
        : [],
    [tokenA, tokenB, bases, basePairs, chainId]
  )

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)
  return useMemo(() => {
    if (currencyAmountIn && currencyOut) {
      // Enhanced debug logging, especially for BNB/ETH pairs
      if (currencyAmountIn.currency instanceof Token && currencyOut instanceof Token) {
        const isBNBOrETH = currencyAmountIn.currency.symbol === 'BNB' || currencyOut.symbol === 'BNB' || 
                           currencyAmountIn.currency.symbol === 'ETH' || currencyOut.symbol === 'ETH'
        console.log('=== useTradeExactIn Debug ===')
        console.log('Input Token:', currencyAmountIn.currency.symbol, currencyAmountIn.currency.address)
        console.log('Output Token:', currencyOut.symbol, currencyOut.address)
        console.log('Input Amount:', currencyAmountIn.toSignificant(6), currencyAmountIn.currency.symbol)
        console.log('Allowed Pairs Count:', allowedPairs.length)
        if (allowedPairs.length > 0) {
          console.log('Allowed Pairs:', allowedPairs.map(p => ({
            token0: p.token0.symbol,
            token1: p.token1.symbol,
            reserve0: p.reserve0.toSignificant(6),
            reserve1: p.reserve1.toSignificant(6),
            pairAddress: p.liquidityToken.address
          })))
          if (isBNBOrETH) {
            console.log(`✅ Found ${allowedPairs.length} valid pair(s) for ${currencyAmountIn.currency.symbol}/${currencyOut.symbol}`)
          }
        } else {
          console.warn('⚠️ No pairs found! This could mean:')
          console.warn('  1. Pair does not exist on chain')
          console.warn('  2. Multicall failed to fetch reserves')
          console.warn('  3. Reserves are zero')
          if (isBNBOrETH) {
            console.error(`❌ CRITICAL: No pairs found for ${currencyAmountIn.currency.symbol}/${currencyOut.symbol}`)
            console.error(`   This means the swap cannot be calculated!`)
            console.error(`   Check the console for pair address calculation and Multicall errors above`)
            console.error(`   Verify the pair exists: Factory.getPair(${currencyAmountIn.currency.address}, ${currencyOut.address})`)
          }
        }
      }
      
      if (allowedPairs.length > 0) {
        const trades = Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 2, maxNumResults: 1 })
        const bestTrade = trades[0] ?? null
        if (bestTrade) {
          console.log('✅ Best Trade Found:', {
            inputAmount: bestTrade.inputAmount.toSignificant(6),
            outputAmount: bestTrade.outputAmount.toSignificant(6),
            route: bestTrade.route.path.map(t => t.symbol).join(' -> ')
          })
        } else {
          console.warn('⚠️ No valid trade found from pairs')
        }
        return bestTrade
      }
    }
    return null
  }, [allowedPairs, currencyAmountIn, currencyOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      return (
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 2, maxNumResults: 1 })[0] ??
        null
      )
    }
    return null
  }, [allowedPairs, currencyIn, currencyAmountOut])
}
