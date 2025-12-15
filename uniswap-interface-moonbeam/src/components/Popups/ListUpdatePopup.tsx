import { TokenList, TokenInfo } from '@uniswap/token-lists'
import React, { useCallback, useMemo } from 'react'
import ReactGA from 'react-ga'
import { useDispatch } from 'react-redux'
import { Text } from 'rebass'
import { AppDispatch } from '../../state'
import { useRemovePopup } from '../../state/application/hooks'
import { acceptListUpdate } from '../../state/lists/actions'
import { TYPE } from '../../theme'
import listVersionLabel from '../../utils/listVersionLabel'
import { ButtonSecondary } from '../Button'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

// Custom implementation of diffTokenLists since it's no longer exported
function diffTokenLists(
  oldTokens: TokenInfo[],
  newTokens: TokenInfo[]
): {
  added: TokenInfo[]
  changed: TokenInfo[]
  removed: TokenInfo[]
} {
  const oldTokenMap: { [chainId: number]: { [address: string]: TokenInfo } } = {}
  const newTokenMap: { [chainId: number]: { [address: string]: TokenInfo } } = {}
  const added: TokenInfo[] = []
  const changed: TokenInfo[] = []
  const removed: TokenInfo[] = []

  // Build old token map
  oldTokens.forEach(token => {
    if (!oldTokenMap[token.chainId]) oldTokenMap[token.chainId] = {}
    oldTokenMap[token.chainId][token.address.toLowerCase()] = token
  })

  // Build new token map
  newTokens.forEach(token => {
    if (!newTokenMap[token.chainId]) newTokenMap[token.chainId] = {}
    newTokenMap[token.chainId][token.address.toLowerCase()] = token
  })

  // Find added and changed tokens
  newTokens.forEach(newToken => {
    const chainId = newToken.chainId
    const address = newToken.address.toLowerCase()
    const oldToken = oldTokenMap[chainId]?.[address]

    if (!oldToken) {
      // Token is new
      added.push(newToken)
    } else {
      // Check if token has changed
      if (
        oldToken.name !== newToken.name ||
        oldToken.symbol !== newToken.symbol ||
        oldToken.decimals !== newToken.decimals ||
        oldToken.logoURI !== newToken.logoURI
      ) {
        changed.push(newToken)
      }
    }
  })

  // Find removed tokens
  oldTokens.forEach(oldToken => {
    const chainId = oldToken.chainId
    const address = oldToken.address.toLowerCase()
    const newToken = newTokenMap[chainId]?.[address]

    if (!newToken) {
      removed.push(oldToken)
    }
  })

  return { added, changed, removed }
}

export default function ListUpdatePopup({
  popKey,
  listUrl,
  oldList,
  newList,
  auto
}: {
  popKey: string
  listUrl: string
  oldList: TokenList
  newList: TokenList
  auto: boolean
}) {
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])
  const dispatch = useDispatch<AppDispatch>()

  const handleAcceptUpdate = useCallback(() => {
    if (auto) return
    ReactGA.event({
      category: 'Lists',
      action: 'Update List from Popup',
      label: listUrl
    })
    dispatch(acceptListUpdate(listUrl))
    removeThisPopup()
  }, [auto, dispatch, listUrl, removeThisPopup])

  const { added: tokensAdded, changed: tokensChanged, removed: tokensRemoved } = useMemo(() => {
    return diffTokenLists(oldList.tokens, newList.tokens)
  }, [newList.tokens, oldList.tokens])
  const numTokensChanged = useMemo(
    () => tokensChanged.length,
    [tokensChanged]
  )

  return (
    <AutoRow>
      <AutoColumn style={{ flex: '1' }} gap="8px">
        {auto ? (
          <TYPE.body fontWeight={500}>
            The token list &quot;{oldList.name}&quot; has been updated to{' '}
            <strong>{listVersionLabel(newList.version)}</strong>.
          </TYPE.body>
        ) : (
          <>
            <div>
              <Text>
                An update is available for the token list &quot;{oldList.name}&quot; (
                {listVersionLabel(oldList.version)} to {listVersionLabel(newList.version)}).
              </Text>
              <ul>
                {tokensAdded.length > 0 ? (
                  <li>
                    {tokensAdded.map((token, i) => (
                      <React.Fragment key={`${token.chainId}-${token.address}`}>
                        <strong title={token.address}>{token.symbol}</strong>
                        {i === tokensAdded.length - 1 ? null : ', '}
                      </React.Fragment>
                    ))}{' '}
                    added
                  </li>
                ) : null}
                {tokensRemoved.length > 0 ? (
                  <li>
                    {tokensRemoved.map((token, i) => (
                      <React.Fragment key={`${token.chainId}-${token.address}`}>
                        <strong title={token.address}>{token.symbol}</strong>
                        {i === tokensRemoved.length - 1 ? null : ', '}
                      </React.Fragment>
                    ))}{' '}
                    removed
                  </li>
                ) : null}
                {numTokensChanged > 0 ? <li>{numTokensChanged} tokens updated</li> : null}
              </ul>
            </div>
            <AutoRow>
              <div style={{ flexGrow: 1, marginRight: 12 }}>
                <ButtonSecondary onClick={handleAcceptUpdate}>Accept update</ButtonSecondary>
              </div>
              <div style={{ flexGrow: 1 }}>
                <ButtonSecondary onClick={removeThisPopup}>Dismiss</ButtonSecondary>
              </div>
            </AutoRow>
          </>
        )}
      </AutoColumn>
    </AutoRow>
  )
}
