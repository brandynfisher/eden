import { MediaType } from '@edenlabs/eden-sdk'

export type Media = {
  uri?: string
  thumbnailUri?: string
  width?: number
  height?: number,
  type: MediaType
}
