import {Creator, MediaAttributes, PaginatedResponse, Reactions, Task} from '.'
import {WebAPICallResult} from '../EdenClient'

export type ConceptsListResponse = WebAPICallResult &
  PaginatedResponse<Concept> & {
  error?: string
}

export type ConceptsGetResponse = WebAPICallResult & {
  error?: string
  concept?: Concept
}

export type ConceptsGetSimilarResponse = WebAPICallResult & {
  error?: string
  similarConcepts?: Concept[]
}

export type ConceptsReactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type ConceptsUnreactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type Concept = {
  _id: string
  user: Creator
  userId?: string
  task: Task
  parent?: string
  uri: string
  thumbnail?: string
  name: string
  attributes: any
  mediaAttributes: MediaAttributes
  praiseCount?: number
  bookmarkCount?: number
  bookmarked?: boolean
  reactions?: Reactions
  createdAt: string
  updatedAt: string
}