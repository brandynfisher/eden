import { AxiosRequestConfig } from 'axios'

import { WebAPICallOptions, WebAPICallResult } from '../EdenClient'

// Arguments

export type MannaBalanceGetArguments = WebAPICallOptions

export interface MannaVouchersRedeemArguments extends WebAPICallOptions {
  code: string
}

// Requests

export const mannaBalanceGetRequestConfig = (): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'manna/balance',
  }
}

export const mannaVouchersRedeemRequestConfig = (
  args: MannaVouchersRedeemArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'manna/vouchers/redeem',
    data: {
      ...args,
    },
  }
}

// Responses

export type MannaBalanceGetResponse = WebAPICallResult & {
  error?: string
  manna: number
}

export type MannaVoucherRedeemResponse = WebAPICallResult & {
  error?: string
  manna: number
  transactionId: string
}
