import { AxiosRequestConfig } from 'axios'

import { WebAPICallOptions, WebAPICallResult } from '../EdenClient'

export interface AdminMannaModifyArguments extends WebAPICallOptions {
  userId: string
  amount: number
}

export interface AdminMannaVouchersCreateArguments extends WebAPICallOptions {
  amount: number
  allowedUserIds?: string[]
}

export interface AdminAuthChallengeArguments extends WebAPICallOptions {
  address: string
  isWeb2: boolean
}

export interface AdminMediaUploadArguments extends WebAPICallOptions {
  media: Buffer
}

// Requests

export const adminMannaModifyRequestConfig = (
  args: AdminMannaModifyArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'admin/manna/modify',
    data: {
      ...args,
    },
  }
}

export const adminMannaVouchersCreateRequestConfig = (
  args: AdminMannaVouchersCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'admin/manna/vouchers/create',
    data: {
      ...args,
    },
  }
}

export const adminAuthChallengeRequestConfig = (
  args: AdminAuthChallengeArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'admin/auth/challenge',
    data: {
      ...args,
    },
  }
}

export const adminMediaUploadRequestConfig = (
  args: AdminMediaUploadArguments,
) => {
  const blob = new Blob([args.media])
  const form = new FormData()
  form.append('file', blob)
  return {
    method: 'POST',
    url: 'media/upload',
    data: form,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
}

// Responses

export type AdminMannaModifyResponse = WebAPICallResult & {
  error?: string
  userId?: string
  manna?: number
  transactionId?: string
}

export type AdminMannaVouchersCreateResponse = WebAPICallResult & {
  error?: string
  code?: string
}

export type AdminAuthChallengeResponse = WebAPICallResult & {
  error?: string
  nonce?: string
}

export type AdminMediaUploadResponse = WebAPICallResult & {
  error?: string
  url?: string
}
