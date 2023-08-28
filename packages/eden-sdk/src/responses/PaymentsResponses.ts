import { WebAPICallResult } from '../EdenClient'

export type PaymentsCreateResponse = WebAPICallResult & {
  error?: string
  url?: string
}
