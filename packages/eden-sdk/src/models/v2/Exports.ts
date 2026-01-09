import {
  ListQueryParams,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { AxiosRequestConfig } from 'axios'

export type DataExportStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled'

export type DataExportMediaType = 'images' | 'videos' | 'audio'

export interface DataExportFilters {
  include_chats: boolean
  include_media_files: boolean
  media_types: DataExportMediaType[]
  agent_ids?: string[]
  created_after?: Date | string | null
  created_before?: Date | string | null
}

export interface DataExportCounts {
  sessions: number
  messages: number
  creations: number
  files: number
  bytes: number
}

export interface DataExportArchive {
  bucket: string
  key: string
  filename: string
  size_bytes: number
  sha256?: string | null
  expires_at: Date
}

export interface DataExport {
  _id: string
  user: string
  status: DataExportStatus
  filters: DataExportFilters
  counts?: DataExportCounts | null
  archive?: DataExportArchive | null
  error?: string | null
  download_count?: number
  last_downloaded_at?: Date | null
  started_at?: Date | null
  completed_at?: Date | null
  expires_at?: Date | null
  cancelled_at?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ExportsCreateArguments extends WebAPICallOptions {
  include_chats?: boolean
  include_media_files?: boolean
  media_types?: DataExportMediaType[]
  agent_ids?: string[]
  created_after?: Date | string | null
  created_before?: Date | string | null
}

export interface ExportsEstimateArguments extends WebAPICallOptions {
  include_chats?: boolean
  include_media_files?: boolean
  media_types?: DataExportMediaType[]
  agent_ids?: string[]
  created_after?: Date | string | null
  created_before?: Date | string | null
}

export interface ExportsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  status?: DataExportStatus
}

export interface ExportsGetArguments extends WebAPICallOptions {
  exportId: string
}

export interface ExportsDownloadArguments extends WebAPICallOptions {
  exportId: string
}

export interface ExportsCancelArguments extends WebAPICallOptions {
  exportId: string
}

export const exportsCreateRequestConfig = (
  args: ExportsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/exports',
    data: {
      ...args,
    },
  }
}

export const exportsListRequestConfig = (
  args: ExportsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/exports',
    params,
  }
}

export const exportsGetRequestConfig = (
  args: ExportsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/exports/${args.exportId}`,
  }
}

export const exportsEstimateRequestConfig = (
  args: ExportsEstimateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/exports/estimate',
    data: {
      ...args,
    },
  }
}

export const exportsDownloadRequestConfig = (
  args: ExportsDownloadArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/exports/${args.exportId}/download`,
    data: {},
  }
}

export const exportsCancelRequestConfig = (
  args: ExportsCancelArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/exports/${args.exportId}/cancel`,
    data: {},
  }
}

export type ExportsCreateResponse = WebAPICallResult & {
  export?: DataExport
  message?: string
}

export type ExportsListResponse = WebAPICallResult & {
  exports: DataExport[]
  total_count: number
}

export type ExportsGetResponse = WebAPICallResult & {
  export?: DataExport
  message?: string
}

export type ExportsDownloadResponse = WebAPICallResult & {
  url?: string
  expires_in_seconds?: number
  message?: string
}

export type ExportsCancelResponse = WebAPICallResult & {
  exportId?: string
  status?: string
  message?: string
}

export type ExportEstimate = {
  sessions: number
  messages: number
  creations: number
  files: number
  bytes: number
}

export type ExportsEstimateResponse = WebAPICallResult & {
  estimate?: ExportEstimate
  limits?: {
    max_files: number
    max_bytes: number
  }
  over_limit?: boolean
  over_limit_reason?: string | null
  missing_files?: number
}
