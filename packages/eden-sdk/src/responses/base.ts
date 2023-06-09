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
