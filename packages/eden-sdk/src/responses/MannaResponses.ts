import { WebAPICallResult } from '../EdenClient'

export type MannaBalanceGetResponse = WebAPICallResult & {
  error?: string
  manna: number
}

export type MannaVoucherRedeemResponse = WebAPICallResult & {
  error?: string
  manna: number
  transactionId: string
}
