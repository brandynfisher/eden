import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { AxiosRequestConfig } from 'axios'

// Arguments

export interface ModelsV2ListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  modelId?: string | string[]
  userId?: string
}

export interface ModelsV2GetArguments extends WebAPICallOptions {
  modelId: string
}

// Requests
export const ModelsV2ListRequestConfig = (
  args: ModelsV2ListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/models',
    params,
  }
}

export const ModelsV2GetRequestConfig = (
  args: ModelsV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/models/${args.modelId}`,
  }
}

// Responses

export type ModelsV2ListResponse = WebAPICallResult &
  PaginatedResponse<ModelV2> & {
    error?: string
  }

export type ModelsV2GetResponse = WebAPICallResult & {
  error?: string
  model?: ModelV2
}

// Types

export type ModelV2 = {
  _id: string
  name: string
  user: string
  args: {
    name: string
    lora_training_urls: string[]
    sd_model_version: string
    concept_mode: string
    num_train_epochs: number
    resolution: number
    seed: number
  }
  thumbnail: string
  slug: string
  public: boolean
  checkpoint: string
  createdAt: string
  updatedAt: string
}
