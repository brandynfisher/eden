import {Creator, PaginatedResponse, Task} from '.'
import {WebAPICallResult} from '../EdenClient'
import {MediaAttributes} from '../responses/CreationsResponses'

export type UploadsListResponse = WebAPICallResult &
  PaginatedResponse<Upload> & {
  error?: string
}

export type UploadsGetResponse = WebAPICallResult & {
  error?: string
  Upload?: Upload
}

export type Upload = {
  _id: string
  user: Creator
  userId?: string
  uri: string
  mediaAttributes: MediaAttributes
  createdAt: string
  updatedAt: string
}
