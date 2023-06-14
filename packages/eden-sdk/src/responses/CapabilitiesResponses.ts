import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type CapabilitiesCreateResponse = WebAPICallResult & {
  error?: string
  capabilityId?: string
}

export type CapabilitiesUpdateResponse = WebAPICallResult & {
  error?: string
  capabilityId?: string
}

export type CapabilitiesDeleteResponse = WebAPICallResult & {
  error?: string
}

export type CapabilitiesListResponse = WebAPICallResult &
  PaginatedResponse<Capability> & {
    error?: string
  }

export type CapabilitiesGetResponse = WebAPICallResult & {
  error?: string
  capability: Capability
}

export enum CapabilityType {
  CHAT = 'chat',
}

export type Capability = {
  id: string
  name: string
  type: CapabilityType
  data: any
}
