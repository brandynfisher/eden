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

export * from './CharactersResponses'
export * from './ApiKeysResponses'
export * from './AuthResponses'
export * from './CreationsResponses'
export * from './ConceptsResponses'
export * from './CollectionsResponses'
export * from './CreatorsResponses'
export * from './GeneratorsResponses'
export * from './MannaResponses'
export * from './ScenariosResponses'
export * from './SessionsResponses'
export * from './TasksResponses'
export * from './PaymentsResponses'
export * from './UploadsResponses'
