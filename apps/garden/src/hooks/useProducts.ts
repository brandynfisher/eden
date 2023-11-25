import { fetcher } from '@/lib/fetcher'
import { Product } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useProducts = () => {
  const { data, mutate, isLoading, error } = useSWR(`/api/products`, fetcher)

  return {
    products: (data?.products as Product[]) || null,
    subscriptions: (data?.subscriptions as Product[]) || null,
    mutate,
    isLoading,
    error,
  }
}
