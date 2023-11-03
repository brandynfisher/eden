import { AxiosRequestConfig } from 'axios'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'
import { transformArgsIntoURLParams } from '../methods'

// Arguments

export interface ScenariosCreateArguments extends WebAPICallOptions {
  name: string
  description: string
  type: ScenarioType
  data: any
}

export interface ScenariosUpdateArguments extends WebAPICallOptions {
  scenarioId: string
  name?: string
  description?: string
  data?: any
}

export interface ScenariosDeleteArguments extends WebAPICallOptions {
  scenarioId: string
}

export interface ScenariosListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface ScenariosGetArguments extends WebAPICallOptions {
  scenarioId: string
}

// Requests

export const scenariosCreateRequestConfig = (
  args: ScenariosCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'scenarios/create',
    data: {
      ...args,
    },
  }
}

export const scenariosUpdateRequestConfig = (
  args: ScenariosUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'scenarios/update',
    data: {
      ...args,
    },
  }
}

export const scenariosDeleteRequestConfig = (
  args: ScenariosDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'scenarios/delete',
    data: {
      ...args,
    },
  }
}

export const scenariosListRequestConfig = (
  args: ScenariosListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'scenarios',
    params,
  }
}

export const scenariosGetRequestConfig = (
  args: ScenariosGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `scenarios/${args.scenarioId}`,
  }
}

// Responses

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

// Types

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
