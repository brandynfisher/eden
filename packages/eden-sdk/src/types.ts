export type Verb = 'GET' | 'POST'

export const INVALID_AUTH_MESSAGE =
  'Missing authentication credentials. Please provide either a token or an API key and secret.'

export interface WebClientOptions {
  edenApiUrl?: string
  token?: string
  apiKey?: string
  apiSecret?: string
}

export interface WebAPICallResult {
  error?: string
  [key: string]: unknown
}

export interface WebAPICallOptions {
  [argument: string]: unknown
}

export interface ListQueryParams {
  page?: number
  limit?: number
  sort?: object
}

export interface PaginatedResponse<T> {
  docs?: T[]
  total?: number
  limit?: number
  pages?: number
  page?: number
  pagingCounter?: number
  hasPrevPage?: boolean
  hasNextPage?: boolean
  prevPage?: number
  nextPage?: number
}

export interface TaskUpdateEvent {
  userId: string
  taskId: string
  status: string
  progress?: number
  result?: string
}

export const transformArgsIntoURLParams = (
  args: Record<string, any>,
): URLSearchParams => {
  const params = new URLSearchParams()

  for (const key in args) {
    if (Object.prototype.hasOwnProperty.call(args, key)) {
      const value = args[key]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item))
        } else {
          params.append(key, value.toString())
        }
      }
    }
  }

  return params
}
