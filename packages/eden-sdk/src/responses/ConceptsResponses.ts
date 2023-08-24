import {Creator, Task, PaginatedResponse, Reactions} from '.'
import {WebAPICallResult} from '../EdenClient'

export type ConceptsListResponse = WebAPICallResult &
  PaginatedResponse<Concept> & {
  error?: string
}

export type ConceptsGetResponse = WebAPICallResult & {
  error?: string
  concept?: Concept
}

export type Concept = {
  _id: string
  user: Creator
  task: Task
  userId?: string
  parent?: string
  uri: string
  thumbnail?: string
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
}