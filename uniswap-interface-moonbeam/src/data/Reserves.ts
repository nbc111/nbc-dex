import { TokenAmount, Pair, Currency, FACTORY_ADDRESS, INIT_CODE_HASH_MAP, ChainId } from 'moonbeamswap'
import { useMemo, useEffect, useRef, useState } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { useActiveWeb3React } from '../hooks'
import { useBlockNumber } from '../state/application/hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

// Factory ABI (minimal - only getPair function)
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
]

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

// Type for storing direct call reserves
interface DirectReserves {
  reserve0: string
  reserve1: string
  blockNumber: number
  onChainAddress?: string // Store the actual on-chain address if different from calculated
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        if (tokenA && tokenB && !tokenA.equals(tokenB)) {
          try {
            const address = Pair.getAddress(tokenA, tokenB)
            // Enhanced logging for BNB/ETH pairs and all pairs in debug mode
            const isBNBOrETH = tokenA.symbol === 'BNB' || tokenB.symbol === 'BNB' || tokenA.symbol === 'ETH' || tokenB.symbol === 'ETH'
            if (isBNBOrETH) {
              const factoryAddr = FACTORY_ADDRESS[chainId || tokenA.chainId]
              const initCodeHash = INIT_CODE_HASH_MAP[chainId || tokenA.chainId] || 'default'
              
              console.log(`📍 Pair Address Calculation: ${tokenA.symbol}/${tokenB.symbol}`, {
                tokenA: { 
                  symbol: tokenA.symbol, 
                  address: tokenA.address,
                  addressLowercase: tokenA.address.toLowerCase(),
                  chainId: tokenA.chainId,
                  decimals: tokenA.decimals
                },
                tokenB: { 
                  symbol: tokenB.symbol, 
                  address: tokenB.address,
                  addressLowercase: tokenB.address.toLowerCase(),
                  chainId: tokenB.chainId,
                  decimals: tokenB.decimals
                },
                pairAddress: address,
                pairAddressLowercase: address.toLowerCase(),
                chainId: chainId,
                factoryAddress: factoryAddr,
                initCodeHash: initCodeHash
              })
              console.log(`   Expected pair contract at: ${address}`)
              console.log(`   Factory: ${factoryAddr}`)
              console.log(`   Init Code Hash: ${initCodeHash}`)
              console.log(`   Use Factory.getPair(${tokenA.address}, ${tokenB.address}) to verify`)
            }
            return address
          } catch (error) {
            console.error('❌ Failed to calculate pair address', {
              tokenA: tokenA ? { symbol: tokenA.symbol, address: tokenA.address } : null,
              tokenB: tokenB ? { symbol: tokenB.symbol, address: tokenB.address } : null,
              error: error
            })
            return undefined
          }
        }
        return undefined
      }),
    [tokens, chainId]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')
  const { library, chainId: activeChainId } = useActiveWeb3React()
  const latestBlockNumber = useBlockNumber()
  const verifiedPairsRef = useRef<Set<string>>(new Set())
  
  // Store direct call reserves as fallback when Multicall fails
  const [directReserves, setDirectReserves] = useState<Map<string, DirectReserves>>(new Map())

  // On-chain verification and direct call fallback for pairs when Multicall fails or returns empty data
  useEffect(() => {
    if (!library || !activeChainId) return

    results.forEach((result, i) => {
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]
      const pairAddress = pairAddresses[i]
      const pairKey = `${tokenA?.address}-${tokenB?.address}`

      if (!tokenA || !tokenB || tokenA.equals(tokenB) || !pairAddress) return

      const isBNBOrETH = tokenA.symbol === 'BNB' || tokenB.symbol === 'BNB' || tokenA.symbol === 'ETH' || tokenB.symbol === 'ETH'
      
      // Check if Multicall failed or returned empty data
      // Also check if we already have direct reserves for this pair (to avoid re-fetching)
      const hasError = result.error || (!result.loading && !result.result)
      const alreadyHasDirectReserve = directReserves.has(pairKey)
      
      // If Multicall failed and we haven't verified this pair yet, try direct call
      // Also try if we don't have direct reserves yet (in case Multicall is still loading but we want to be proactive)
      if (hasError && !verifiedPairsRef.current.has(pairKey) && !alreadyHasDirectReserve) {
        verifiedPairsRef.current.add(pairKey)
        
        const factoryAddress = FACTORY_ADDRESS[activeChainId as ChainId]
        if (!factoryAddress) return

        const factory = new Contract(factoryAddress, FACTORY_ABI, library)
        const pairName = `${tokenA.symbol}/${tokenB.symbol}`
        
        // Step 1: Verify pair address on-chain
        factory.getPair(tokenA.address, tokenB.address)
          .then(async (onChainPairAddress: string) => {
            const calculatedAddress = pairAddress.toLowerCase()
            const onChainAddress = onChainPairAddress.toLowerCase()
            
            if (isBNBOrETH) {
              console.log(`🔍 On-chain verification for ${pairName}:`)
              console.log(`   Calculated Pair Address: ${calculatedAddress}`)
              console.log(`   On-chain Pair Address: ${onChainAddress}`)
              console.log(`   Match: ${calculatedAddress === onChainAddress ? '✅ YES' : '❌ NO'}`)
            }
            
            if (onChainPairAddress === '0x0000000000000000000000000000000000000000') {
              if (isBNBOrETH) {
                console.error(`   ❌ Pair does NOT exist on-chain!`)
                console.error(`   You need to create this pair by adding liquidity first.`)
                console.error(`   Factory.getPair(${tokenA.address}, ${tokenB.address}) = 0x0000...`)
              }
              // Remove from verified set so we can retry later if needed
              verifiedPairsRef.current.delete(pairKey)
            } else if (calculatedAddress !== onChainAddress) {
              if (isBNBOrETH) {
                console.error(`   ❌ Address mismatch! This is a critical error.`)
                console.error(`   The calculated address doesn't match the on-chain address.`)
                console.error(`   Calculated: ${calculatedAddress}`)
                console.error(`   On-chain: ${onChainAddress}`)
                console.error(`   Check Factory address, INIT_CODE_HASH, and token addresses.`)
                console.error(`   Token A: ${tokenA.symbol} (${tokenA.address})`)
                console.error(`   Token B: ${tokenB.symbol} (${tokenB.address})`)
                console.error(`   Factory: ${factoryAddress}`)
                console.error(`   ⚠️ WORKAROUND: Will use on-chain address for direct calls`)
              }
              
              // WORKAROUND: Even if addresses don't match, try to use the on-chain address
              // This handles cases where the calculation is wrong but the pair exists
              try {
                const pairContract = new Contract(onChainPairAddress, PAIR_INTERFACE, library)
                const reserves = await pairContract.getReserves()
                
                const reserve0 = reserves[0].toString()
                const reserve1 = reserves[1].toString()
                
                if (isBNBOrETH) {
                  console.log(`   ⚠️ Using on-chain address (mismatch workaround):`, {
                    calculatedAddress: calculatedAddress,
                    onChainAddress: onChainAddress,
                    reserve0: reserve0,
                    reserve1: reserve1
                  })
                }
                
                if (reserve0 === '0' || reserve1 === '0') {
                  if (isBNBOrETH) {
                    console.warn(`   ⚠️ WARNING: Pair exists but reserves are ZERO!`)
                  }
                } else {
                  // Store direct call reserves with on-chain address
                  setDirectReserves(prev => {
                    if (prev.has(pairKey)) {
                      const existing = prev.get(pairKey)!
                      if (existing.reserve0 === reserve0 && existing.reserve1 === reserve1) {
                        return prev
                      }
                    }
                    const newMap = new Map(prev)
                    newMap.set(pairKey, {
                      reserve0,
                      reserve1,
                      blockNumber: latestBlockNumber || 0,
                      onChainAddress: onChainAddress
                    })
                    if (isBNBOrETH) {
                      console.log(`   ✅ Stored reserves using on-chain address (mismatch workaround)`)
                    }
                    return newMap
                  })
                }
              } catch (directCallError: any) {
                if (isBNBOrETH) {
                  console.error(`   ❌ Direct call to on-chain address also failed:`, directCallError.message)
                }
                verifiedPairsRef.current.delete(pairKey)
              }
            } else {
              if (isBNBOrETH) {
                console.log(`   ✅ Pair exists on-chain at correct address: ${onChainAddress}`)
              }
              
              // Step 2: Try to call getReserves() directly (bypass Multicall)
              try {
                const pairContract = new Contract(onChainPairAddress, PAIR_INTERFACE, library)
                const reserves = await pairContract.getReserves()
                
                const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
                const reserve0 = reserves[0].toString()
                const reserve1 = reserves[1].toString()
                
                if (isBNBOrETH) {
                  console.log(`   ✅ Direct getReserves() call SUCCESS!`, {
                    reserve0: reserve0,
                    reserve1: reserve1,
                    blockTimestampLast: reserves[2].toString()
                  })
                }
                
                if (reserve0 === '0' || reserve1 === '0') {
                  if (isBNBOrETH) {
                    console.warn(`   ⚠️ WARNING: Pair exists but reserves are ZERO!`)
                    console.warn(`   This means the pair was created but no liquidity has been added yet.`)
                    console.warn(`   You cannot swap until liquidity is added.`)
                  }
                  // Don't store zero reserves, but keep the pair in verified set
                } else {
                  // Store direct call reserves for use in pair creation
                  setDirectReserves(prev => {
                    // Check if we already have reserves for this pair to avoid unnecessary updates
                    if (prev.has(pairKey)) {
                      const existing = prev.get(pairKey)!
                      if (existing.reserve0 === reserve0 && existing.reserve1 === reserve1) {
                        return prev // No change, return same map
                      }
                    }
                    const newMap = new Map(prev)
                    newMap.set(pairKey, {
                      reserve0,
                      reserve1,
                      blockNumber: latestBlockNumber || 0
                    })
                    if (isBNBOrETH) {
                      console.log(`   ✅ Storing direct reserves in state - component will re-render`)
                    }
                    return newMap
                  })
                  
                  if (isBNBOrETH) {
                    console.log(`   ✅ Pair has liquidity (using direct call as fallback):`, {
                      token0: token0.symbol,
                      token1: token1.symbol,
                      reserve0: reserve0,
                      reserve1: reserve1,
                      reserve0Formatted: new TokenAmount(token0, reserve0).toSignificant(6),
                      reserve1Formatted: new TokenAmount(token1, reserve1).toSignificant(6)
                    })
                    console.log(`   ✅ Direct call reserves stored - Swap page should now work!`)
                  }
                }
              } catch (directCallError: any) {
                if (isBNBOrETH) {
                  console.error(`   ❌ Direct getReserves() call FAILED:`, directCallError.message)
                  console.error(`   This means the pair contract exists but getReserves() reverts.`)
                  console.error(`   Possible causes:`)
                  console.error(`   1. Pair contract is not properly initialized`)
                  console.error(`   2. Pair contract has a bug`)
                  console.error(`   3. RPC node issue`)
                }
                // Remove from verified set so we can retry later if needed
                verifiedPairsRef.current.delete(pairKey)
              }
            }
          })
          .catch((error: any) => {
            if (isBNBOrETH) {
              console.error(`   ❌ Failed to verify pair on-chain:`, error.message)
            }
            // Remove from verified set so we can retry later if needed
            verifiedPairsRef.current.delete(pairKey)
          })
      }
    })
  }, [results, tokens, pairAddresses, library, activeChainId, latestBlockNumber, directReserves])

  return useMemo(() => {
    return results.map((result, i): [PairState, Pair | null] => {
      const { result: reserves, loading, error } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]
      const pairAddress = pairAddresses[i]
      const pairKey = `${tokenA?.address}-${tokenB?.address}`

      // Check if we have direct call reserves as fallback
      // Use direct reserves if:
      // 1. We have direct reserves stored, AND
      // 2. (Multicall has an error OR Multicall finished loading but returned no valid reserves) OR Multicall is still loading
      // This makes the UI more responsive by using direct reserves immediately when available
      const directReserve = directReserves.get(pairKey)
      const hasValidMulticallReserves = reserves && reserves.reserve0 && reserves.reserve1
      const useDirectReserve = directReserve && (loading || error || (!loading && !hasValidMulticallReserves))

      // Enhanced debug logging for pair state, especially for BNB/ETH pairs
      // TypeScript type guard: ensure pairAddress is not undefined
      if (tokenA && tokenB && !tokenA.equals(tokenB) && pairAddress) {
        // At this point, TypeScript knows pairAddress is not undefined
        const safePairAddress = pairAddress
        const pairName = `${tokenA.symbol}/${tokenB.symbol}`
        const isBNBOrETH = tokenA.symbol === 'BNB' || tokenB.symbol === 'BNB' || tokenA.symbol === 'ETH' || tokenB.symbol === 'ETH'
        
        if (loading && !useDirectReserve) {
          if (isBNBOrETH) {
            console.log(`⏳ Pair ${pairName} (${safePairAddress}): Loading reserves via Multicall...`)
            console.log(`   Waiting for Multicall to fetch getReserves() from pair contract`)
          } else {
            console.log(`⏳ Pair ${pairName} (${safePairAddress}): Loading...`)
          }
        } else if (error && !useDirectReserve) {
          console.error(`❌ Pair ${pairName} (${safePairAddress}): Error fetching reserves`)
          console.error(`   Token A: ${tokenA.symbol} (${tokenA.address})`)
          console.error(`   Token B: ${tokenB.symbol} (${tokenB.address})`)
          console.error(`   Pair Address: ${safePairAddress}`)
          console.error(`   This usually means:`)
          console.error(`   1. Multicall failed (check Multicall contract at chainId ${chainId})`)
          console.error(`   2. Pair contract doesn't exist at this address`)
          console.error(`   3. RPC node issue or timeout`)
          console.error(`   4. getReserves() call reverted (pair may not be initialized)`)
          if (isBNBOrETH) {
            console.error(`   🔍 Debugging steps for ${pairName}:`)
            console.error(`   1. Check if pair exists: Factory.getPair(${tokenA.address}, ${tokenB.address})`)
            console.error(`   2. If pair exists, check if it's initialized: Pair.getReserves()`)
            console.error(`   3. Verify Multicall contract is working: Multicall.aggregate([...])`)
            console.error(`   (On-chain verification will run automatically...)`)
          }
        } else if (!reserves && !useDirectReserve) {
          console.warn(`⚠️ Pair ${pairName} (${safePairAddress}): NOT_EXISTS - Pair may not exist on chain`)
          if (isBNBOrETH) {
            console.warn(`   This means Multicall returned no data (0x) for getReserves()`)
            console.warn(`   The pair contract likely doesn't exist at ${safePairAddress}`)
            console.warn(`   Verify with: Factory.getPair(${tokenA.address}, ${tokenB.address})`)
            console.warn(`   (On-chain verification will run automatically...)`)
          }
        } else {
          // Use direct reserves if available, otherwise use Multicall reserves
          const finalReserves = useDirectReserve ? directReserve : reserves
          if (useDirectReserve && isBNBOrETH) {
            const onChainAddr = directReserve?.onChainAddress
            if (onChainAddr && onChainAddr.toLowerCase() !== safePairAddress.toLowerCase()) {
              console.log(`✅ Pair ${pairName}: Using direct call reserves (address mismatch workaround)`, {
                calculatedAddress: safePairAddress,
                onChainAddress: onChainAddr,
                note: 'Using on-chain address because calculated address does not match'
              })
            } else {
              console.log(`✅ Pair ${pairName} (${safePairAddress}): Using direct call reserves (Multicall fallback)`)
            }
          }
          
          if (finalReserves) {
            // Extract reserve values based on source
            let reserve0: { toString: () => string }
            let reserve1: { toString: () => string }
            
            if (useDirectReserve && directReserve) {
              reserve0 = { toString: () => directReserve.reserve0 }
              reserve1 = { toString: () => directReserve.reserve1 }
            } else if (reserves && reserves.reserve0 && reserves.reserve1) {
              reserve0 = reserves.reserve0
              reserve1 = reserves.reserve1
            } else {
              // This shouldn't happen if finalReserves is set, but TypeScript needs this check
              // Return NOT_EXISTS if we can't extract reserves
              return [PairState.NOT_EXISTS, null]
            }
            
            const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
            const reserve0Amount = reserve0.toString()
            const reserve1Amount = reserve1.toString()
            const isZeroReserve = reserve0Amount === '0' || reserve1Amount === '0'
            if (isZeroReserve) {
              console.warn(`⚠️ Pair ${pairName} (${safePairAddress}): EXISTS but reserves are zero!`, {
                token0: token0.symbol,
                token1: token1.symbol,
                reserve0: reserve0Amount,
                reserve1: reserve1Amount
              })
              if (isBNBOrETH) {
                console.warn(`   ⚠️ WARNING: Pair exists but has no liquidity!`)
                console.warn(`   You cannot swap until liquidity is added to this pair`)
              }
            } else {
              if (isBNBOrETH) {
                console.log(`✅ Pair ${pairName} (${safePairAddress}): EXISTS with reserves`, {
                  token0: token0.symbol,
                  token1: token1.symbol,
                  reserve0: reserve0Amount,
                  reserve1: reserve1Amount,
                  reserve0Formatted: new TokenAmount(token0, reserve0Amount).toSignificant(6),
                  reserve1Formatted: new TokenAmount(token1, reserve1Amount).toSignificant(6),
                  source: useDirectReserve ? 'direct call (fallback)' : 'Multicall'
                })
              } else {
                console.log(`✅ Pair ${pairName} (${safePairAddress}): EXISTS with reserves`, {
                  reserve0: reserve0Amount,
                  reserve1: reserve1Amount
                })
              }
            }
          }
        }
      }

      if (loading && !useDirectReserve) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      
      // Use direct reserves if available, otherwise check Multicall reserves
      if (useDirectReserve && directReserve) {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
        return [
          PairState.EXISTS,
          new Pair(new TokenAmount(token0, directReserve.reserve0), new TokenAmount(token1, directReserve.reserve1))
        ]
      }
      
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
      ]
    })
  }, [results, tokens, pairAddresses, chainId, directReserves])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
