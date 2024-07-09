import {
  ListQueryParams,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { AxiosRequestConfig } from 'axios'

export type GeneratorOutputTypeV2 =
  | 'video'
  | 'image'
  | 'model'
  | 'text'
  | 'audio'

// Arguments
export type GeneratorsListArgumentsV2 = WebAPICallOptions &
  ListQueryParams & {
    hideParams?: boolean
  }

export interface GeneratorsGetArgumentsV2 extends WebAPICallOptions {
  generatorKey: string
}

// Requests
export const generatorsListRequestConfigV2 = (
  args: GeneratorsListArgumentsV2,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)

  return {
    method: 'GET',
    url: 'v2/generators',
    params,
  }
}

export const generatorsGetRequestConfigV2 = (
  args: GeneratorsGetArgumentsV2,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/generators/${args.generatorKey}`,
  }
}

// Responses

export type GeneratorsListResponseV2 = WebAPICallResult & {
  generators?: GeneratorV2[]
  error?: string
}

export type GeneratorsGetResponseV2 = WebAPICallResult & {
  generator?: GeneratorV2
  error?: string
}

// Types

export type GeneratorV2 = {
  key: string
  name: string
  description?: string
  hidden?: boolean
  parameters?: GeneratorParameterV2[]
  outputType: GeneratorOutputTypeV2
}

export type GeneratorParameterType =
  | 'video'
  | 'image'
  | 'model'
  | 'text'
  | 'audio'

export type GeneratorParameterV2 = {
  name: string
  label: string
  description?: string
  type: GeneratorParameterType
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
