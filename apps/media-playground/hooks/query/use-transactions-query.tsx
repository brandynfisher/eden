'use client'

import { fetcher } from '@/lib/fetcher'
import { Transaction } from '@edenlabs/eden-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'

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
  const queryKey = ['transactions']

  const {
    data,
    error,
    isError,
    isPending,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    getNextPageParam: (lastPage: TransactionsResponse) => {
      return lastPage.hasNextPage ? lastPage.nextPage : undefined
    },
    queryFn: async ({ pageParam = 1 }) => {
      return fetcher<TransactionsResponse>(
        `/api/transactions?page=${pageParam}&limit=${limit}`,
      )
    },
  })

  const transactions = data?.pages.flatMap(page => page.docs) ?? []
  const lastPage = data?.pages[data.pages.length - 1]

  return {
    transactions,
    hasMore: hasNextPage,
    totalPages: lastPage?.pages,
    currentPage: lastPage?.page,
    totalTransactions: lastPage?.total,
    fetchNextPage,
    isFetchingNextPage,
    error,
    isError,
    isPending,
    isLoading,
    status,
  }
}
