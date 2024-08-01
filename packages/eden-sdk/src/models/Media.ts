import { WebAPICallOptions, WebAPICallResult } from '../types'
import { MediaType } from './Creations'

export interface MediaAttributes {
  type: MediaType
  duration?: number
  width?: number
  height?: number
  aspectRatio?: number
}

// Arguments

export interface MediaUploadArguments extends WebAPICallOptions {
  media: Buffer
}

// Requests

export const mediaUploadRequestConfig = (args: MediaUploadArguments) => {
  const blob = new Blob([args.media])
  const form = new FormData()
  form.append('file', blob)
  return {
    method: 'POST',
    url: '/media/upload',
    data: form,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
}

// Responses

export type MediaUploadResponse = WebAPICallResult & {
  error?: string
  url?: string
}
