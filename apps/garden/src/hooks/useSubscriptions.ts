import { fetcher } from '@/lib/fetcher'
import type { Stripe } from 'stripe'
import useSWR from 'swr'

export const useSubscriptions = () => {
  const { data, mutate, isLoading, error } = useSWR(
    `/api/subscriptions`,
    fetcher,
  )

  return {
    subscriptions: data?.subscriptions as Stripe.Subscription[] | null,
    mutate,
    isLoading,
    error,
  }
}
