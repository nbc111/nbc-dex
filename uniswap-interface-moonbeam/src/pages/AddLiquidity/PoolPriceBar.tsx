import { Currency, DEV, Percent, Price } from 'moonbeamswap'
import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { Field } from '../../state/mint/actions'
import { TYPE } from '../../theme'
import { getNativeCurrencySymbol } from '../../utils'

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  // Get the display symbol for the currency (NBC for DEV on NBC Chain, otherwise use currency.symbol)
  const getDisplaySymbol = (currency: Currency | undefined): string => {
    if (!currency) return ''
    if (currency === DEV) {
      return getNativeCurrencySymbol(chainId)
    }
    return currency.symbol || ''
  }

  const symbolA = getDisplaySymbol(currencies[Field.CURRENCY_A])
  const symbolB = getDisplaySymbol(currencies[Field.CURRENCY_B])

  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <TYPE.black>{price?.toSignificant(6) ?? '-'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {symbolB} per {symbolA}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>{price?.invert()?.toSignificant(6) ?? '-'}</TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            {symbolA} per {symbolB}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <TYPE.black>
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </TYPE.black>
          <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
            Share of Pool
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}
