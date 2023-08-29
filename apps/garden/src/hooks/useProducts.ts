import { fetcher } from '@/lib/fetcher'
import type { Stripe } from 'stripe'
import useSWR from 'swr'

export const useProducts = () => {
  const { data, mutate, isLoading, error } = useSWR(`/api/products`, fetcher)

  return {
    products: data?.products as Stripe.Product[] | null,
    mutate,
    isLoading,
    error,
  }
}
