import { AxiosRequestConfig } from 'axios'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'

// Arguments

export type GeneratorsListArguments = WebAPICallOptions & ListQueryParams

export interface GeneratorsGetArguments extends WebAPICallOptions {
  generatorName: string
}

// Requests

export const generatorsListRequestConfig = (): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'generators',
  }
}

export const generatorsGetRequestConfig = (
  args: GeneratorsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `generators/${args.generatorName}`,
  }
}

// Responses

export type GeneratorsListResponse = WebAPICallResult &
  PaginatedResponse<Generator> & {
    error?: string
  }

export type GeneratorsGetResponse = WebAPICallResult & {
  error?: string
  generator?: Generator
}

// Types

export type Generator = {
  generatorName: string
  description: string
  output: string
  defaultVersionId?: string
  versions: GeneratorVersion[]
}

export type GeneratorVersion = {
  versionId: string
  parameters: GeneratorParameter[]
}

export type GeneratorParameter = {
  name: string
  label: string
  description?: string
  isRequired?: boolean
  optional?: boolean
  default?: any
  allowedValues?: any[]
  allowedValuesFrom?: string
  minimum?: number
  maximum?: number
  step?: number
  minLength?: number
  maxLength?: number
  mediaUpload?: string
}
