import { withSessionRoute } from '@/lib/withSession'
import { NextApiRequest, NextApiResponse } from 'next'
import type { Stripe } from 'stripe'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const dummyStripeProductsListResponse: Stripe.Product[] = [
      {
        id: 'prod_f4268604',
        object: 'product',
        active: true,
        created: 1692744011,
        default_price: null,
        description: 'Receive 1000 Manna',
        images: [],
        livemode: false,
        metadata: {},
        name: 'Manna Refill - 1000',
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        tax_code: null,
        unit_label: null,
        updated: 1692744011,
        url: null,
        attributes: [],
        type: 'service',
      },
      {
        id: 'prod_e7489ffc5c70',
        object: 'product',
        active: true,
        created: 1692744012,
        default_price: null,
        description: 'Receive 5000 Manna',
        images: [],
        livemode: false,
        metadata: {},
        name: 'Manna Refill - 5000',
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        tax_code: null,
        unit_label: null,
        updated: 1692744011,
        url: null,
        attributes: [],
        type: 'service',
      },
      {
        id: 'prod_e7489ffc5122',
        object: 'product',
        active: true,
        created: 1692744013,
        default_price: null,
        description: 'Receive 15000 Manna',
        images: [],
        livemode: false,
        metadata: {},
        name: 'Manna Refill - 15000',
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        tax_code: null,
        unit_label: null,
        updated: 1692744011,
        url: null,
        attributes: [],
        type: 'service',
      },
    ]

    return res.status(200).json({ products: dummyStripeProductsListResponse })

    // const response = await eden.products.list()
    // return res.status(200).json({ products: response.docs })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
