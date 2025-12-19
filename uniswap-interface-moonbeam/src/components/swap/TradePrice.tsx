import React from 'react'
import { Price, DEV, Currency } from 'moonbeamswap'
import { useContext } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { getNativeCurrencySymbol } from '../../utils'
import { StyledBalanceMaxMini } from './styleds'

interface TradePriceProps {
  price?: Price
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  // Get the correct symbol for display (NBC for DEV on NBC Chain, otherwise use currency.symbol)
  const getDisplaySymbol = (currency: Currency | undefined): string => {
    if (!currency) return ''
    if (currency === DEV) {
      return getNativeCurrencySymbol(chainId)
    }
    return currency.symbol || ''
  }

  const formattedPrice = showInverted ? price?.toSignificant(6) : price?.invert()?.toSignificant(6)

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency)
  const baseSymbol = getDisplaySymbol(price?.baseCurrency)
  const quoteSymbol = getDisplaySymbol(price?.quoteCurrency)
  const label = showInverted
    ? `${quoteSymbol} per ${baseSymbol}`
    : `${baseSymbol} per ${quoteSymbol}`

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text2}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
            <Repeat size={14} />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  )
}
