import { PaginatedResponse } from 'src/responses/base'

import { WebAPICallResult } from '../EdenClient'

export type CreationsListResponse = WebAPICallResult &
  PaginatedResponse<Creation> & {
    error?: string
  }

export type Creation = {
  _id: string
  user: string
  task: string
  parent?: string
  delegateUser?: string
  delegateHasClaimed?: boolean
  uri: string
  thumbnail?: string
  name: string
  attributes: any
}
