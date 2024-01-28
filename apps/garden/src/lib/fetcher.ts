import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { CONFIG } from '@/lib/config'
import { message } from 'antd'
import { MessageInstance } from 'antd/es/message/interface'
import axios, { AxiosError } from 'axios'

// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then(res => res.json())

export const handleAxiosError = (
  error: AxiosError | unknown,
  messageInstance: MessageInstance,
  customMessage?: string,
) => {
  if (axios.isAxiosError(error)) {
    const toastMessage =
      customMessage ??
      (error.response?.data.message || 'Unknown Error has occurred')

    message.destroy()
    message.error(toastMessage)
  }
}

export const handleAxiosServerError = (error: AxiosError | unknown) => {
  if (axios.isAxiosError(error)) {
    const errorMessage =
      error.response?.data.message || 'Unknown Error has occurred'
    return errorMessage
  }

  return 'Unknown Error has occurred'
}

export const getAdminHeaders = () => {
  return {
    'X-Api-Key': CONFIG.EDEN_ADMIN_API_KEY,
    'X-Api-Secret': CONFIG.EDEN_ADMIN_API_SECRET,
  }
}

export const createPaginationRoute = (
  baseUrl: string,
  query: PaginatedFeedQuery,
) => {
  const basePath = baseUrl
  const params: PaginatedFeedQuery = {}

  if (query.limit && query.page) {
    params.page = query.page
    params.limit = query.limit
  }
  if (query.userId) {
    params.userId = String(query.userId)
  }
  if (query.creationId) {
    params.creationId = String(query.creationId)
  }
  if (query.characterId) {
    params.characterId = String(query.characterId)
  }
  if (query.conceptId) {
    params.conceptId = String(query.conceptId)
  }
  if (query.generatorId) {
    params.generatorId = String(query.generatorId)
  }
  if (query.name && query.name.length > 0) {
    params.name = String(query.name)
  }
  if (query.collectionId) {
    params.collectionId = String(query.collectionId)
  }
  if (query.orderBy) {
    params.orderBy = String(query.orderBy)
  }
  if (query.direction) {
    params.direction = Number(query.direction)
  }
  if (query.dateCutOff) {
    params.dateCutOff = query.dateCutOff
  }

  const queryString = Object.keys(params)
    //@ts-ignore
    .map(key => `${key}=${params[key]}`)
    .join('&')

  return queryString ? `${basePath}?${queryString}` : basePath
}
