import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type ScenariosCreateResponse = WebAPICallResult & {
  error?: string
  scenarioId?: string
}

export type ScenariosUpdateResponse = WebAPICallResult & {
  error?: string
  scenarioId?: string
}

export type ScenariosDeleteResponse = WebAPICallResult & {
  error?: string
}

export type ScenariosListResponse = WebAPICallResult &
  PaginatedResponse<Scenario> & {
    error?: string
  }

export type ScenariosGetResponse = WebAPICallResult & {
  error?: string
  scenario: Scenario
}

export enum ScenarioType {
  CHATROOM = 'chatroom',
  MONOLOGUE = 'monologue',
  DIALOGUE = 'dialogue',
}

export type Scenario = {
  id: string
  name: string
  description: string
  type: ScenarioType
  data: any
}
