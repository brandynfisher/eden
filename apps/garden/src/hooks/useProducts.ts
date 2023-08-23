import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export type Product = {
  id: string
  object: string //"product"
  active: boolean
  created: number //1692744011
  default_price: string | null
  description: string | null
  images: []
  livemode: boolean
  metadata: {} //{},
  name: string //"Order f4268604-2f9c-4538-8919-e7489ffc5c70",
  package_dimensions: string | null
  shippable: boolean | null
  statement_descriptor: string | null
  tax_code: string | null
  unit_label: string | null
  updated: number //1692744011
  url: string | null
}

export const useProducts = () => {
  const { data, mutate, isLoading, error } = useSWR(`/api/products`, fetcher)

  return {
    products: data?.products as Product[] | null,
    mutate,
    isLoading,
    error,
  }
}
