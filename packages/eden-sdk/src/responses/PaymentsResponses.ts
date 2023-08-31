import { WebAPICallResult } from '../EdenClient'

export type PaymentsCreateResponse = WebAPICallResult & {
  error?: string
  url?: string
}

export type PaymentsProductsResponse = WebAPICallResult & {
  error?: string
  products?: Product[]
}

export type Product = {
  id: string
  object: string
  active: boolean
  created: number
  default_price: string
  description: string
  images: string[]
  livemode: boolean
  metadata: {}
  name: string
  package_dimensions: null
  displayPrice: {
    currency: string
    unit_amount: number
  }
  shippable: null
  statement_descriptor: null
  tax_code: null
  unit_label: null
  updated: number
  url: null
}
