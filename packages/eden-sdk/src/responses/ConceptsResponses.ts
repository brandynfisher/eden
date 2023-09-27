import { Creator, Task, PaginatedResponse, Reactions } from '.'
import {WebAPICallResult} from '../EdenClient'

export type ConceptsListResponse = WebAPICallResult &
  PaginatedResponse<Concept> & {
  error?: string
}

export type ConceptsGetResponse = WebAPICallResult & {
  error?: string
  concept?: Concept
}

export type ConceptsUpdateResponse = WebAPICallResult & {
  error?: string
  concept?: Concept
}

export type ConceptsDeleteResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type Concept = {
  _id: string
  user: Creator
  task: Task
  userId?: string
  parent?: string
  uri: string
  thumbnail?: string
  training_images?: string[]
  checkpoint?: string
  name: string
  publicName: string
  conceptName: string
  attributes: any
  praiseCount?: number
  bookmarkCount?: number
  bookmarked?: boolean
  reactions?: Reactions
  createdAt: string
  updatedAt: string
  isPrivate?: boolean,
  deleted?: boolean
}