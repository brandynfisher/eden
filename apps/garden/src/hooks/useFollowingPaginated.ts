import {
  FollowersRouteQueryParams,
  PaginatedFollowersQuery,
} from '@/hooks/useFollowersPaginated'
import { fetcher } from '@/lib/fetcher'
import { Creator } from '@edenlabs/eden-sdk'
import { useCallback } from 'react'
import useSWRInfinite from 'swr/infinite'

export const useFollowingPaginated = (query: PaginatedFollowersQuery = {}) => {
  const pageLimit = query?.limit || 10

  const route = (limit: number, page: number) => {
    const basePath = `/api/following`
    const params: FollowersRouteQueryParams = {}

    if (pageLimit && page) {
      params.page = page
      params.limit = pageLimit
    }

    if (query?.userId) {
      params.userId = query.userId
    }

    const queryString = Object.keys(params)
      //@ts-ignore
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const getKey = useCallback(
    (pageIndex: number, previousPageData: Creator[]): string | null => {
      if ((pageIndex === 0 && previousPageData === null) || pageIndex !== 0) {
        return route(pageLimit, pageIndex + 1)
      }

      return null
    },
    [pageLimit],
  )

  const {
    data,
    mutate: refetch,
    size,
    setSize,
    // isLoading,
    // isValidating,
  } = useSWRInfinite(getKey, fetcher, { revalidateOnFocus: false })
  const dataArray = data != null ? data.flat() : []

  // const isLoadingMore =
  //   isLoading ||
  //   (size > 0 && data != null && typeof data[size - 1] === 'undefined')
  // const isEmpty = data?.[0]?.total === 0 || data?.[0]?.length === 0

  // const maybeLoadMore = () => {
  //   if (isValidating) return
  //   if (isLoading || isLoadingMore) return
  //   if (isEmpty || (data && data.length >= data?.[0]?.pages)) return
  //   if (!data?.[data?.length - 1]?.hasNextPage) return
  //
  //   setSize(prevSize => prevSize + 1)
  // }

  const creatorDocs: Creator[] = (
    dataArray ? [...dataArray.map(pageData => pageData.docs)] : []
  ).flat()

  return {
    items: creatorDocs,
    refetch,
    size,
    setSize,
    // isEmpty,
  }
}
