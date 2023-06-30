import { Creation, PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type CollectionsCreateResponse = WebAPICallResult & {
  error?: string
  collectionId?: string
}

export type CollectionsUpdateResponse = WebAPICallResult & {
  error?: string
  characterId?: string
}

export type CollectionsDeleteResponse = WebAPICallResult & {
  error?: string
}

export type CollectionsAddCreationsResponse = WebAPICallResult & {
  error?: string
}

export type CollectionsRemoveCreationsResponse = WebAPICallResult & {
  error?: string
}

export type CollectionsListResponse = WebAPICallResult &
  PaginatedResponse<Collection> & {
    error?: string
  }

export type CollectionsGetResponse = WebAPICallResult & {
  error?: string
  collection: Collection
}

export type Collection = {
  _id: string
  name: string
  description: string
  isDefaultCollection: boolean
  creations: Creation[]
  displayImageUri?: string
  creatorId?: string
}
