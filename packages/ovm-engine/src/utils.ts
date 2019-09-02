import {
  Address,
  SignedTransaction,
  State,
  MockRollupStateMachine,
  Balances,
  UNISWAP_ADDRESS,
  TokenType,
  Transaction,
} from '.'

/* Utilities */
export const generateTransferTx = (
  recipient: Address,
  tokenType: TokenType,
  amount: number
): Transaction => {
  return {
    tokenType,
    recipient,
    amount,
  }
}
