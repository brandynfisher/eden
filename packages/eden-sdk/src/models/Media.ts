import { WebAPICallOptions, WebAPICallResult } from '../types'

export interface MediaAttributes {
  type: string
  mimeType: string
  duration?: number
  width?: number
  height?: number
  aspectRatio?: number
  blur?: string
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  Text = 'text',
  Audio = 'audio',
  Zip = 'zip',
  Model = 'model',
  Unknown = 'unknown',
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
