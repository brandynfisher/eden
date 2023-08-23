import { Product } from '@/hooks/useProducts'
import { withSessionRoute } from '@/lib/withSession'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const dummyStripeProductsListResponse: Product[] = [
      {
        id: 'prod_f4268604',
        object: 'product',
        active: true,
        created: 1692744011,
        default_price: null,
        description: null,
        images: [],
        livemode: false,
        metadata: {},
        name: 'Order f4268604',
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        tax_code: null,
        unit_label: null,
        updated: 1692744011,
        url: null,
      },
      {
        id: 'prod_e7489ffc5c70',
        object: 'product',
        active: true,
        created: 1692744011,
        default_price: null,
        description: null,
        images: [],
        livemode: false,
        metadata: {},
        name: 'Order e7489ffc5c70',
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        tax_code: null,
        unit_label: null,
        updated: 1692744011,
        url: null,
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
