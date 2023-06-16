import { PaginatedResponse } from 'src/responses'

import { WebAPICallResult } from '../EdenClient'

export type CreatorsFollowResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreatorsUnfollowResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreatorsListResponse = WebAPICallResult &
  PaginatedResponse<Creator> & {
    error?: string
  }

export type CreatorsGetResponse = WebAPICallResult & {
  error?: string
  creator?: Creator
}

export type Creator = {
  userId: string
  creations?: string[]
  collections?: string[]
  followers?: string[]
  following?: string[]
}
