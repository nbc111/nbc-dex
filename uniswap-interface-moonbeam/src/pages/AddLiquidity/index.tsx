import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { ChainId, Currency, currencyEquals, DEV, Token, TokenAmount, WDEV } from 'moonbeamswap'
import { FACTORY_ADDRESS } from 'moonbeamswap'
import React, { useCallback, useContext, useState } from 'react'
import { Plus } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { BlueCard, GreyCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFlat } from '../../components/Row'

import { ROUTER_ADDRESS } from '../../constants'
import { PairState } from '../../data/Reserves'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import ERC20_INTERFACE from '../../constants/abis/erc20'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserDeadline, useUserSlippageTolerance } from '../../state/user/hooks'
import { currencyId, getNativeCurrencySymbol } from '../../utils'
import { TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { PoolPriceBar } from './PoolPriceBar'

// Factory ABI (minimal - only getPair function)
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
]

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  // Get the display symbol for the currency (NBC for DEV on NBC Chain, otherwise use currency.symbol)
  const getDisplaySymbol = (currency: Currency | null | undefined): string => {
    if (!currency) return ''
    if (currency === DEV) {
      return getNativeCurrencySymbol(chainId)
    }
    return currency.symbol || ''
  }

  const oneCurrencyIsWDEV = Boolean(
    chainId &&
      ((currencyA && currencyEquals(currencyA, WDEV[chainId])) ||
        (currencyB && currencyEquals(currencyB, WDEV[chainId])))
  )

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const [deadline] = useUserDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field])
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    ROUTER_ADDRESS[chainId ? chainId : '']
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    ROUTER_ADDRESS[chainId ? chainId : '']
  )

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
    }

    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (currencyA === DEV || currencyB === DEV) {
      const tokenBIsETH = currencyB === DEV
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // DEV min
        account,
        deadlineFromNow
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadlineFromNow
      ]
      value = null
    }

    setAttemptingTxn(true)
    
    // Debug logging
    console.log('=== Add Liquidity Debug ===')
    console.log('Chain ID:', chainId)
    console.log('Router Address:', ROUTER_ADDRESS[chainId ? chainId : ''])
    console.log('Account:', account)
    console.log('Currency A:', currencyA === DEV ? 'DEV (NBC)' : currencyA?.symbol, currencyA === DEV ? '' : (currencyA instanceof Token ? currencyA.address : ''))
    console.log('Currency B:', currencyB === DEV ? 'DEV (NBC)' : currencyB?.symbol, currencyB === DEV ? '' : (currencyB instanceof Token ? currencyB.address : ''))
    console.log('Parsed Amount A:', parsedAmountA?.toSignificant(6), parsedAmountA?.raw.toString())
    console.log('Parsed Amount B:', parsedAmountB?.toSignificant(6), parsedAmountB?.raw.toString())
    console.log('Approval A State:', ApprovalState[approvalA])
    console.log('Approval B State:', ApprovalState[approvalB])
    console.log('Currency A Balance:', currencyBalances[Field.CURRENCY_A]?.toSignificant(6))
    console.log('Currency B Balance:', currencyBalances[Field.CURRENCY_B]?.toSignificant(6))
    console.log('Method:', currencyA === DEV || currencyB === DEV ? 'addLiquidityETH' : 'addLiquidity')
    console.log('Args:', args)
    console.log('Value:', value?.toString())
    console.log('Amounts Min:', {
      A: amountsMin[Field.CURRENCY_A]?.toString(),
      B: amountsMin[Field.CURRENCY_B]?.toString()
    })
    console.log('Deadline:', deadlineFromNow, new Date(deadlineFromNow * 1000).toLocaleString())
    
    // Additional diagnostic info
    if (currencyA === DEV || currencyB === DEV) {
      const tokenAddress = wrappedCurrency(currencyA === DEV ? currencyB : currencyA, chainId)?.address
      console.log('Token Address (for addLiquidityETH):', tokenAddress)
      console.log('WDEV Address (from SDK):', WDEV[chainId || ChainId.STANDALONE]?.address)
      console.log('Expected Pair:', tokenAddress && WDEV[chainId || ChainId.STANDALONE]?.address ? 
        `Token(${tokenAddress})/WDEV(${WDEV[chainId || ChainId.STANDALONE]?.address})` : 'N/A')
      
      // Check Router's WETH address on-chain
      try {
        const routerWETH = await router.WETH()
        console.log('Router WETH Address (on-chain):', routerWETH)
        if (routerWETH.toLowerCase() !== WDEV[chainId || ChainId.STANDALONE]?.address.toLowerCase()) {
          console.warn('⚠️ WARNING: Router WETH address does not match SDK WDEV address!')
          console.warn('   Router WETH:', routerWETH)
          console.warn('   SDK WDEV:', WDEV[chainId || ChainId.STANDALONE]?.address)
        } else {
          console.log('✅ Router WETH address matches SDK WDEV address')
        }
      } catch (error) {
        console.error('Failed to get Router WETH address:', error)
      }
      
      // Check if pair exists
      if (tokenAddress) {
        try {
          const factoryAddress = FACTORY_ADDRESS[chainId || ChainId.STANDALONE]
          const factory = new Contract(factoryAddress, FACTORY_ABI, library.getSigner())
          const pairAddress = await factory.getPair(tokenAddress, WDEV[chainId || ChainId.STANDALONE]?.address)
          console.log('Pair Address:', pairAddress)
          if (pairAddress === '0x0000000000000000000000000000000000000000') {
            console.log('⚠️ Pair does not exist yet - will be created on first liquidity add')
          } else {
            console.log('✅ Pair exists:', pairAddress)
            // Check pair reserves
            try {
              const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)
              const pairContract = new Contract(pairAddress, PAIR_INTERFACE, library.getSigner())
              const [reserve0, reserve1] = await pairContract.getReserves()
              console.log('Pair Reserves:', {
                reserve0: reserve0.toString(),
                reserve1: reserve1.toString()
              })
            } catch (err) {
              console.warn('Could not get pair reserves:', err)
            }
          }
        } catch (error) {
          console.error('Failed to check pair:', error)
        }
      }
      
      // Check token allowance
      if (tokenAddress) {
        try {
          const tokenBIsETH = currencyB === DEV
          const tokenContract = new Contract(tokenAddress, ERC20_INTERFACE, library.getSigner())
          const allowance = await tokenContract.allowance(account, ROUTER_ADDRESS[chainId])
          const neededAmount = tokenBIsETH ? parsedAmountA.raw.toString() : parsedAmountB.raw.toString()
          console.log('Token Allowance:', allowance.toString(), '(needed:', neededAmount, ')')
          if (BigNumber.from(allowance).lt(BigNumber.from(neededAmount))) {
            console.error('❌ Token allowance insufficient!')
            console.error('   Current:', allowance.toString())
            console.error('   Needed:', neededAmount)
          } else {
            console.log('✅ Token allowance sufficient')
          }
        } catch (error) {
          console.error('Failed to check token allowance:', error)
        }
      }
    }
    
    // Check if approvals are actually approved
    if (approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED) {
      console.error('❌ Approval check failed!')
      console.error('  Approval A:', ApprovalState[approvalA], '(should be APPROVED)')
      console.error('  Approval B:', ApprovalState[approvalB], '(should be APPROVED)')
      setAttemptingTxn(false)
      return
    }
    
    // Check balances
    if (!currencyBalances[Field.CURRENCY_A] || !currencyBalances[Field.CURRENCY_B]) {
      console.error('❌ Balance check failed!')
      console.error('  Balance A:', currencyBalances[Field.CURRENCY_A]?.toSignificant(6) || 'undefined')
      console.error('  Balance B:', currencyBalances[Field.CURRENCY_B]?.toSignificant(6) || 'undefined')
      setAttemptingTxn(false)
      return
    }
    
    if (currencyBalances[Field.CURRENCY_A].lessThan(parsedAmountA) || currencyBalances[Field.CURRENCY_B].lessThan(parsedAmountB)) {
      console.error('❌ Insufficient balance!')
      console.error('  Required A:', parsedAmountA?.toSignificant(6), 'Available:', currencyBalances[Field.CURRENCY_A]?.toSignificant(6))
      console.error('  Required B:', parsedAmountB?.toSignificant(6), 'Available:', currencyBalances[Field.CURRENCY_B]?.toSignificant(6))
      setAttemptingTxn(false)
      return
    }
    
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit => {
        console.log('Gas Estimate:', estimatedGasLimit.toString())
        return method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              getDisplaySymbol(currencies[Field.CURRENCY_A]) +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              getDisplaySymbol(currencies[Field.CURRENCY_B])
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [getDisplaySymbol(currencies[Field.CURRENCY_A]), getDisplaySymbol(currencies[Field.CURRENCY_B])].join('/')
          })
        })
      })
      .catch(async error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error('=== Add Liquidity Error ===')
          console.error('Error Code:', error?.code)
          console.error('Error Message:', error?.message)
          console.error('Error Data:', error?.data)
          console.error('Full Error:', error)
          
          // Try to get more detailed error using callStatic
          if (error?.code === -32603) {
            console.error('Attempting to get detailed error via callStatic...')
            try {
              await router.callStatic[currencyA === DEV || currencyB === DEV ? 'addLiquidityETH' : 'addLiquidity'](
                ...args,
                value ? { value } : {}
              )
              console.error('callStatic succeeded - this is unexpected')
            } catch (callError: any) {
              console.error('callStatic Error:', callError)
              console.error('callStatic Error Reason:', callError?.reason)
              console.error('callError Error Data:', callError?.error?.data)
              
              // Try to decode the error
              if (callError?.reason) {
                console.error('Decoded Error Reason:', callError.reason)
                if (callError.reason.includes('INSUFFICIENT')) {
                  console.error('❌ Issue: Insufficient amount or allowance')
                } else if (callError.reason.includes('EXPIRED')) {
                  console.error('❌ Issue: Deadline expired')
                } else if (callError.reason.includes('TRANSFER')) {
                  console.error('❌ Issue: Token transfer failed - check approval')
                } else {
                  console.error('❌ Issue:', callError.reason)
                }
              }
            }
            
            console.error('RPC Internal Error - This might be a node issue or contract revert')
            console.error('Try checking:')
            console.error('  1. Token approval status')
            console.error('  2. Account balance')
            console.error('  3. Router contract address')
            console.error('  4. RPC node status')
          }
          
          // Check for common issues
          if (error?.message?.includes('insufficient') || error?.message?.includes('allowance')) {
            console.error('Possible issue: Insufficient balance or allowance')
          }
          if (error?.message?.includes('expired') || error?.message?.includes('deadline')) {
            console.error('Possible issue: Deadline expired')
          }
        }
      })
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="20px">
        <LightCard mt="20px" borderRadius="20px">
          <RowFlat>
            <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
              {getDisplaySymbol(currencies[Field.CURRENCY_A]) + '/' + getDisplaySymbol(currencies[Field.CURRENCY_B])}
            </Text>
            <DoubleCurrencyLogo
              currency0={currencies[Field.CURRENCY_A]}
              currency1={currencies[Field.CURRENCY_B]}
              size={30}
            />
          </RowFlat>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {liquidityMinted?.toSignificant(6)}
          </Text>
          <DoubleCurrencyLogo
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
          />
        </RowFlat>
        <Row>
          <Text fontSize="24px">
            {getDisplaySymbol(currencies[Field.CURRENCY_A]) + '/' + getDisplaySymbol(currencies[Field.CURRENCY_B]) + ' Pool Tokens'}
          </Text>
        </Row>
        <TYPE.italic fontSize={12} textAlign="left" padding={'8px 0 0 0 '}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    getDisplaySymbol(currencies[Field.CURRENCY_A])
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${getDisplaySymbol(currencies[Field.CURRENCY_B])}`

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA, chainId)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA, chainId]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB, chainId)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : getNativeCurrencySymbol(chainId)}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB, chainId]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  return (
    <>
      <AppBody>
        <AddRemoveTabs adding={true} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() => (
              <ConfirmationModalContent
                title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="20px">
            {noLiquidity && (
              <ColumnCenter>
                <BlueCard>
                  <AutoColumn gap="10px">
                    <TYPE.link fontWeight={600} color={'primaryText1'}>
                      You are the first liquidity provider.
                    </TYPE.link>
                    <TYPE.link fontWeight={400} color={'primaryText1'}>
                      The ratio of tokens you add will set the price of this pool.
                    </TYPE.link>
                    <TYPE.link fontWeight={400} color={'primaryText1'}>
                      Once you are happy with the rate click supply to review.
                    </TYPE.link>
                  </AutoColumn>
                </BlueCard>
              </ColumnCenter>
            )}
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onFieldAInput}
              onMax={() => {
                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
              }}
              onCurrencySelect={handleCurrencyASelect}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
              currency={currencies[Field.CURRENCY_A]}
              id="add-liquidity-input-tokena"
              showCommonBases
            />
            <ColumnCenter>
              <Plus size="16" color={theme.text2} />
            </ColumnCenter>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onCurrencySelect={handleCurrencyBSelect}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
              }}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
              currency={currencies[Field.CURRENCY_B]}
              id="add-liquidity-input-tokenb"
              showCommonBases
            />
            {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
              <>
                <GreyCard padding="0px" borderRadius={'20px'}>
                  <RowBetween padding="1rem">
                    <TYPE.subHeader fontWeight={500} fontSize={14}>
                      {noLiquidity ? 'Initial prices' : 'Prices'} and pool share
                    </TYPE.subHeader>
                  </RowBetween>{' '}
                  <LightCard padding="1rem" borderRadius={'20px'}>
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </LightCard>
                </GreyCard>
              </>
            )}

            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>Approving {getDisplaySymbol(currencies[Field.CURRENCY_A])}</Dots>
                          ) : (
                            'Approve ' + getDisplaySymbol(currencies[Field.CURRENCY_A])
                          )}
                        </ButtonPrimary>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>Approving {getDisplaySymbol(currencies[Field.CURRENCY_B])}</Dots>
                          ) : (
                            'Approve ' + getDisplaySymbol(currencies[Field.CURRENCY_B])
                          )}
                        </ButtonPrimary>
                      )}
                    </RowBetween>
                  )}
                <ButtonError
                  onClick={() => {
                    expertMode ? onAdd() : setShowConfirm(true)
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                  error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {error ?? 'Supply'}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {pair && !noLiquidity && pairState !== PairState.INVALID ? (
        <AutoColumn style={{ minWidth: '20rem', marginTop: '1rem' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWDEV} pair={pair} />
        </AutoColumn>
      ) : null}
    </>
  )
}
