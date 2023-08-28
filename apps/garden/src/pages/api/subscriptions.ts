import { withSessionRoute } from '@/lib/withSession'
import { NextApiRequest, NextApiResponse } from 'next'
import type { Stripe } from 'stripe'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const dummyStripeSubscriptionsListResponse: Stripe.Subscription[] = [
      {
        id: 'sub_f4268604',
        object: 'subscription',
        created: 1692744011,
        description: 'Receive 1000 Manna each month',
        name: 'Casual',
        items: {
          data: [
            {
              id: 'prod_f4268604_1',
              object: 'subscription_item',
              created: 1692744011,
              metadata: {},
              plan: null,
              subscription: null,
              price: {
                id: 'price_1NiNTi2eZvKYlo2CDIajzp2E',
                object: 'price',
                active: true,
                billing_scheme: 'per_unit',
                created: 1692821794,
                currency: 'usd',
                custom_unit_amount: null,
                livemode: false,
                lookup_key: null,
                metadata: {},
                nickname: null,
                product: 'prod_OVOGsEvetQAMft',
                recurring: {
                  aggregate_usage: null,
                  interval: 'month',
                  interval_count: 1,
                  usage_type: 'licensed',
                  trial_period_days: 0,
                },
                tax_behavior: 'unspecified',
                tiers_mode: null,
                transform_quantity: null,
                type: 'recurring',
                unit_amount: 1999,
                unit_amount_decimal: '1999',
              },
            },
            {
              id: 'prod_f4268604_2',
              object: 'subscription_item',
              created: 1692744011,
              metadata: {},
              plan: null,
              subscription: null,
              price: {
                id: 'price_1NiNTi2eZvKYlo2CDIajzp21',
                object: 'price',
                active: true,
                billing_scheme: 'per_unit',
                created: 1692821794,
                currency: 'usd',
                custom_unit_amount: null,
                livemode: false,
                lookup_key: null,
                metadata: {},
                nickname: null,
                product: 'prod_OVOGsEvetQAMft',
                recurring: {
                  aggregate_usage: null,
                  interval: 'year',
                  interval_count: 1,
                  usage_type: 'licensed',
                  trial_period_days: 0,
                },
                tax_behavior: 'unspecified',
                tiers_mode: null,
                transform_quantity: null,
                type: 'recurring',
                unit_amount: 19990,
                unit_amount_decimal: '19990',
              },
            },
          ],
        },
      },
      {
        id: 'sub_qweqweqwe',
        object: 'subscription',
        created: 1692744011,
        description: 'Receive 5000 Manna each month',
        name: 'Pro',
        items: {
          data: [
            {
              id: 'prod_qweqweqwe_1',
              object: 'subscription_item',
              created: 1692744011,
              metadata: {},
              plan: null,
              subscription: null,
              price: {
                id: 'price_qweqweqwesub',
                object: 'price',
                active: true,
                billing_scheme: 'per_unit',
                created: 1692821794,
                currency: 'usd',
                custom_unit_amount: null,
                livemode: false,
                lookup_key: null,
                metadata: {},
                nickname: null,
                product: 'prod_OVOGsEvetQAMft',
                recurring: {
                  aggregate_usage: null,
                  interval: 'month',
                  interval_count: 1,
                  usage_type: 'licensed',
                  trial_period_days: 0,
                },
                tax_behavior: 'unspecified',
                tiers_mode: null,
                transform_quantity: null,
                type: 'recurring',
                unit_amount: 4999,
                unit_amount_decimal: '4999',
              },
            },
            {
              id: 'prod_qweqweqwe_2',
              object: 'subscription_item',
              created: 1692744011,
              metadata: {},
              plan: null,
              subscription: null,
              price: {
                id: 'price_1NiNTi2eZvKYlo2CDIajzp2E',
                object: 'price',
                active: true,
                billing_scheme: 'per_unit',
                created: 1692821794,
                currency: 'usd',
                custom_unit_amount: null,
                livemode: false,
                lookup_key: null,
                metadata: {},
                nickname: null,
                product: 'prod_OVOGsEvetQAMft',
                recurring: {
                  aggregate_usage: null,
                  interval: 'year',
                  interval_count: 1,
                  usage_type: 'licensed',
                  trial_period_days: 0,
                },
                tax_behavior: 'unspecified',
                tiers_mode: null,
                transform_quantity: null,
                type: 'recurring',
                unit_amount: 49990,
                unit_amount_decimal: '49990',
              },
            },
          ],
        },
      },
    ]

    return res
      .status(200)
      .json({ subscriptions: dummyStripeSubscriptionsListResponse })

    // const response = await eden.products.list()
    // return res.status(200).json({ products: response.docs })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
