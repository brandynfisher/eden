import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type CharactersCreateResponse = WebAPICallResult & {
  error?: string
  characterId?: string
}

export type CharactersUpdateResponse = WebAPICallResult & {
  error?: string
}

export type CharactersDeleteResponse = WebAPICallResult & {
  error?: string
}

export type CharactersListResponse = WebAPICallResult &
  PaginatedResponse<Character> & {
    error?: string
  }

export type CharactersGetResponse = WebAPICallResult & {
  error?: string
  character?: Character
}

export type Character = {
  id: string
  user: string
  name: string
  description?: string
  greeting?: string
  dialogue?: any[]
  image?: string
}
