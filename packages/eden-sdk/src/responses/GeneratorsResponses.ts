import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type GeneratorsListResponse = WebAPICallResult &
  PaginatedResponse<Generator> & {
    error?: string
  }

export type GeneratorsGetResponse = WebAPICallResult & {
  error?: string
  generator?: Generator
}

export type Generator = {
  generatorName: string
  description: string
  output: string
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
