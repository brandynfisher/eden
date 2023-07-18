import { WebAPICallResult } from '../EdenClient'

export type MediaUploadResponse = WebAPICallResult & {
  error?: string
  url?: string
}