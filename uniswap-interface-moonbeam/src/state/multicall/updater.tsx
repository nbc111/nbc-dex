import { Contract } from '@ethersproject/contracts'
import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useMulticallContract } from '../../hooks/useContract'
import useDebounce from '../../hooks/useDebounce'
import chunkArray from '../../utils/chunkArray'
import { CancelledError, retry, RetryableError } from '../../utils/retry'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import {
  Call,
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  parseCallKey,
  updateMulticallResults
} from './actions'

// chunk calls so we do not exceed the gas limit
// Reduced for NBC chain to avoid multicall failures
// Further reduced because Multicall uses require(success) which fails if any call fails
const CALL_CHUNK_SIZE = 10

/**
 * Fetches a chunk of calls, enforcing a minimum block number constraint
 * @param multicallContract multicall contract to fetch against
 * @param chunk chunk of calls to make
 * @param minBlockNumber minimum block number of the result set
 */
async function fetchChunk(
  multicallContract: Contract,
  chunk: Call[],
  minBlockNumber: number
): Promise<{ results: string[]; blockNumber: number }> {
  console.debug('Fetching chunk', multicallContract, chunk, minBlockNumber)
  let resultsBlockNumber, returnData
  try {
    const calls = chunk.map(obj => [obj.address, obj.callData])
    console.log(`📞 Multicall: Calling ${calls.length} contracts`)
    console.log(`   Multicall Address: ${multicallContract.address}`)
    console.log(`   Calls:`, calls.map(([addr, data]) => `${addr.substring(0, 10)}... (${data.substring(0, 10)}...)`))
    ;[resultsBlockNumber, returnData] = await multicallContract.aggregate(calls)
    console.log(`✅ Multicall: Success! Block: ${resultsBlockNumber.toString()}, Results: ${returnData.length}`)
    
    // Log detailed results for debugging, especially for pair contracts
    returnData.forEach((data: string, index: number) => {
      const call = chunk[index]
      const isGetReserves = call.callData.startsWith('0x0902f1ac') // getReserves() function selector
      
      if (!data || data === '0x' || data.length <= 2) {
        console.warn(`⚠️ Multicall result ${index}: Empty or invalid data`, {
          address: call.address,
          callData: call.callData.substring(0, 10) + '...',
          function: isGetReserves ? 'getReserves()' : 'unknown',
          data: data || 'undefined',
          dataLength: data?.length || 0
        })
        if (isGetReserves) {
          console.warn(`   This is a getReserves() call - the pair contract may not exist at ${call.address}`)
          console.warn(`   Or the pair exists but is not initialized (no liquidity added yet)`)
          console.warn(`   Or Multicall contract has an issue calling this pair contract`)
          console.warn(`   🔍 Next step: Check if pair exists on-chain using Factory.getPair()`)
          console.warn(`   🔍 If pair exists, try calling getReserves() directly (bypass Multicall)`)
        }
      } else {
        if (isGetReserves) {
          // Try to decode getReserves result for better debugging
          try {
            // getReserves returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
            // Each uint112 is 32 bytes (padded), so we have 96 bytes total
            if (data.length >= 194) { // 0x + 96 bytes = 194 chars
              const reserve0Hex = '0x' + data.slice(34, 66)
              const reserve1Hex = '0x' + data.slice(66, 98)
              const reserve0 = BigInt(reserve0Hex)
              const reserve1 = BigInt(reserve1Hex)
              console.log(`✅ Multicall result ${index}: getReserves() - Valid reserves`, {
                pairAddress: call.address,
                reserve0: reserve0.toString(),
                reserve1: reserve1.toString(),
                hasLiquidity: reserve0 > BigInt(0) && reserve1 > BigInt(0)
              })
            } else {
              console.log(`✅ Multicall result ${index}: Valid data (getReserves)`, {
                address: call.address,
                dataLength: data.length,
                dataPreview: data.substring(0, 66)
              })
            }
          } catch (e) {
            console.log(`✅ Multicall result ${index}: Valid data (getReserves)`, {
              address: call.address,
              dataLength: data.length,
              dataPreview: data.substring(0, 66)
            })
          }
        } else {
          console.log(`✅ Multicall result ${index}: Valid data`, {
            address: call.address,
            dataLength: data.length,
            dataPreview: data.substring(0, 66) // First 32 bytes
          })
        }
      }
    })
  } catch (error: any) {
    console.error(`❌ Multicall: Failed to fetch chunk`, {
      multicallAddress: multicallContract.address,
      chunkSize: chunk.length,
      error: error.message,
      errorCode: error.code,
      errorData: error.data
    })
    console.error(`   This usually means:`)
    console.error(`   1. Multicall contract has an issue (check deployment)`)
    console.error(`   2. One or more contracts in the chunk don't exist or reverted`)
    console.error(`   3. RPC node issue`)
    console.error(`   First call in chunk:`, chunk[0] ? `${chunk[0].address} (${chunk[0].callData.substring(0, 20)}...)` : 'N/A')
    throw error
  }
  if (resultsBlockNumber.toNumber() < minBlockNumber) {
    console.debug(`Fetched results for old block number: ${resultsBlockNumber.toString()} vs. ${minBlockNumber}`)
    throw new RetryableError('Fetched for old block number')
  }
  return { results: returnData, blockNumber: resultsBlockNumber.toNumber() }
}

/**
 * From the current all listeners state, return each call key mapped to the
 * minimum number of blocks per fetch. This is how often each key must be fetched.
 * @param allListeners the all listeners state
 * @param chainId the current chain id
 */
export function activeListeningKeys(
  allListeners: AppState['multicall']['callListeners'],
  chainId?: number
): { [callKey: string]: number } {
  if (!allListeners || !chainId) return {}
  const listeners = allListeners[chainId]
  if (!listeners) return {}

  return Object.keys(listeners).reduce<{ [callKey: string]: number }>((memo, callKey) => {
    const keyListeners = listeners[callKey]

    memo[callKey] = Object.keys(keyListeners)
      .filter(key => {
        const blocksPerFetch = parseInt(key)
        if (blocksPerFetch <= 0) return false
        return keyListeners[blocksPerFetch] > 0
      })
      .reduce((previousMin, current) => {
        return Math.min(previousMin, parseInt(current))
      }, Infinity)
    return memo
  }, {})
}

/**
 * Return the keys that need to be refetched
 * @param callResults current call result state
 * @param listeningKeys each call key mapped to how old the data can be in blocks
 * @param chainId the current chain id
 * @param latestBlockNumber the latest block number
 */
export function outdatedListeningKeys(
  callResults: AppState['multicall']['callResults'],
  listeningKeys: { [callKey: string]: number },
  chainId: number | undefined,
  latestBlockNumber: number | undefined
): string[] {
  if (!chainId || !latestBlockNumber) return []
  const results = callResults[chainId]
  // no results at all, load everything
  if (!results) return Object.keys(listeningKeys)

  return Object.keys(listeningKeys).filter(callKey => {
    const blocksPerFetch = listeningKeys[callKey]

    const data = callResults[chainId][callKey]
    // no data, must fetch
    if (!data) return true

    const minDataBlockNumber = latestBlockNumber - (blocksPerFetch - 1)

    // already fetching it for a recent enough block, don't refetch it
    if (data.fetchingBlockNumber && data.fetchingBlockNumber >= minDataBlockNumber) return false

    // if data is older than minDataBlockNumber, fetch it
    return !data.blockNumber || data.blockNumber < minDataBlockNumber
  })
}

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['multicall']>(state => state.multicall)
  // wait for listeners to settle before triggering updates
  const debouncedListeners = useDebounce(state.callListeners, 100)
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()
  const cancellations = useRef<{ blockNumber: number; cancellations: (() => void)[] }>()
  const listeningKeys: { [callKey: string]: number } = useMemo(() => {
    return activeListeningKeys(debouncedListeners, chainId)
  }, [debouncedListeners, chainId])
  const unserializedOutdatedCallKeys = useMemo(() => {
    return outdatedListeningKeys(state.callResults, listeningKeys, chainId, latestBlockNumber)
  }, [chainId, state.callResults, listeningKeys, latestBlockNumber])

  const serializedOutdatedCallKeys = useMemo(() => JSON.stringify(unserializedOutdatedCallKeys.sort()), [
    unserializedOutdatedCallKeys
  ])
  useEffect(() => {
    if (!latestBlockNumber || !chainId || !multicallContract) return

    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys)
    if (outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map(key => parseCallKey(key))
    const chunkedCalls = chunkArray(calls, CALL_CHUNK_SIZE)

    if (cancellations.current?.blockNumber !== latestBlockNumber) {
      if (cancellations.current?.cancellations) {
        cancellations.current.cancellations.forEach(c => c())
      }
    }

    dispatch(
      fetchingMulticallResults({
        calls,
        chainId,
        fetchingBlockNumber: latestBlockNumber
      })
    )
    
    cancellations.current = {
      blockNumber: latestBlockNumber,
      cancellations: chunkedCalls.map((chunk, index) => {
        const { cancel, promise } = retry(() => fetchChunk(multicallContract, chunk, latestBlockNumber), {
          n: Infinity,
          minWait: 2500,
          maxWait: 3500
        })
        promise
          .then(({ results: returnData, blockNumber: fetchBlockNumber }) => {
            cancellations.current = { cancellations: [], blockNumber: latestBlockNumber }

            // accumulates the length of all previous 
            const firstCallKeyIndex = chunkedCalls.slice(0, index).reduce<number>((memo, curr) => memo + curr.length, 0)
            const lastCallKeyIndex = firstCallKeyIndex + returnData.length

            dispatch(
              updateMulticallResults({
                chainId,
                results: outdatedCallKeys
                  .slice(firstCallKeyIndex, lastCallKeyIndex)
                  .reduce<{ [callKey: string]: string | null }>((memo, callKey, i) => {
                    memo[callKey] = returnData[i] ?? null
                    return memo
                  }, {}),
                blockNumber: fetchBlockNumber
              })
            )
          })
          .catch((error: any) => {
            if (error instanceof CancelledError) {
              console.debug('Cancelled fetch for blockNumber', latestBlockNumber)
              return
            }
            console.error('❌ Failed to fetch multicall chunk', {
              chunkIndex: index,
              chunkSize: chunk.length,
              chainId,
              blockNumber: latestBlockNumber,
              error: error.message,
              errorCode: error.code,
              errorData: error.data
            })
            console.error('   First call in failed chunk:', chunk[0] ? {
              address: chunk[0].address,
              callData: chunk[0].callData.substring(0, 20) + '...'
            } : 'N/A')
            dispatch(
              errorFetchingMulticallResults({
                calls: chunk,
                chainId,
                fetchingBlockNumber: latestBlockNumber
              })
            )
          })
        return cancel
      })
    }
  }, [chainId, multicallContract, dispatch, serializedOutdatedCallKeys, latestBlockNumber])

  return null
}
