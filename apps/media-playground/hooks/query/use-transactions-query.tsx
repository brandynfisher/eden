'use client'

import { fetcher } from '@/lib/fetcher'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export type Transaction = {
  _id: string
  amount: number
  type: string
  createdAt: string
  code?: string
}

interface TransactionsResponse {
  docs: Transaction[]
  total: number
  limit: number
  page: number
  pages: number
  hasNextPage: boolean
  nextPage: number | null
}

export const useTransactionsQuery = (props?: { limit?: number }) => {
  const { limit = 10 } = props || {}
  const [page, setPage] = useState(1)
  const queryKey = ['transactions', page, limit]

  const { data, error, isError, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      return fetcher<TransactionsResponse>(
        `/api/transactions?page=${page}&limit=${limit}`,
      )
    },
  })

  const transactions = data?.docs ?? []
  const currentPage = data?.page ?? 1
  const totalPages = data?.pages ?? 0
  const totalTransactions = data?.total ?? 0
  const hasMore = data?.hasNextPage ?? false
  const hasPrevious = page > 1

  const goToNextPage = () => {
    if (hasMore) {
      setPage(prev => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (hasPrevious) {
      setPage(prev => prev - 1)
    }
  }

  const goToFirstPage = () => {
    if (page !== 1) {
      setPage(1)
    }
  }

  const goToLastPage = () => {
    if (totalPages > 0 && page !== totalPages) {
      setPage(totalPages)
    }
  }

  return {
    transactions,
    hasMore,
    hasPrevious,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    isFetching,
    isLoading,
    isError,
    error,
    currentPage,
    totalPages,
    totalTransactions,
  }
}
