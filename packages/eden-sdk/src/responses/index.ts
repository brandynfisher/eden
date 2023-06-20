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

export * from './AgentsResponses'
export * from './ApiKeysResponses'
export * from './AuthResponses'
export * from './CapabilitiesResponses'
export * from './CreationsResponses'
export * from './CollectionsResponses'
export * from './CreatorsResponses'
export * from './GeneratorsResponses'
export * from './MannaResponses'
export * from './ScenariosResponses'
export * from './TasksResponses'
