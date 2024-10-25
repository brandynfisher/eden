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
  | 'lora'

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

export type BaseModelName = 'sdxl' | 'flux'

export type GeneratorV2 = {
  key: string
  name: string
  description?: string
  private?: boolean
  parameters?: GeneratorParameterV2[]
  outputType: GeneratorOutputTypeV2
  costEstimate?: string
  resolutions?: string[]
  thumbnail?: string
  order?: number
  baseModel?: BaseModelName
}

export type GeneratorParameterType =
  | 'video'
  | 'image'
  | 'model'
  | 'audio'
  | 'string'
  | 'int'
  | 'float'
  | 'bool'
  | 'lora'
  | 'video[]'
  | 'image[]'
  | 'model[]'
  | 'audio[]'
  | 'string[]'
  | 'int[]'
  | 'float[]'
  | 'bool[]'
  | 'lora[]'

export type GeneratorParameterV2 = {
  name: string
  label: string
  description: string
  tip: string | null
  type: GeneratorParameterType
  required: boolean
  default: string | number | null | undefined
  minimum: number | null | undefined
  maximum: number | null | undefined
  min_length: number | null | undefined
  max_length: number | null | undefined
  step: number | null | undefined
  choices: Array<string | number> | null | undefined
  hide_from_agent?: boolean
  hide_from_ui?: boolean
  visible_if?: string
}
