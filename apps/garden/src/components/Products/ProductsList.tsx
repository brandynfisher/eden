import LoadingIndicator from '@/components/LoadingIndicator'
import SubscriptionCard from '@/components/Products/SubscriptionCard'
import { useProducts } from '@/hooks/useProducts'
import { handleAxiosError } from '@/lib/fetcher'
import { subscriptionTierNameMap } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { Creator, Product, SubscriptionTier } from '@edenlabs/eden-sdk'
import { Button, message } from 'antd'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const ProductCard = dynamic(() => import('@/components/Products/ProductCard'), {
  loading: () => <LoadingIndicator />,
})

const sortByPrice = (a: Product, b: Product) => {
  const aPrice = a.displayPrice.unit_amount
  const bPrice = b.displayPrice.unit_amount
  return aPrice > bPrice ? 1 : -1
}

const dummyFeatures: { [key in SubscriptionTier]: string[] } = {
  0: [],
  1: [
    '1000 Manna / month',
    '10% Discount on Manna-Refills',
    '3 concurrent creation jobs',
    'Private creations',
  ],
  2: [
    '3500 Manna / month',
    '20% Discount on Manna-Refills',
    '6 concurrent creation jobs',
    'Private creations',
    'API access',
    'Premium generators',
    'Export Concepts for use in other apps',
  ],
  3: [
    '7500 Manna / month',
    '30% Discount on Manna-Refills',
    '10 concurrent creation jobs',
    'Private creations',
    'API access',
    'Premium generators',
    'Export Concepts for use in other apps',
    'Early access to preview features',
    'Priority support',
  ],
}

const ProductsList = ({
  checkoutHandler,
}: {
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const router = useRouter()
  const { user } = useContext(UserContext)
  const { products, subscriptions } = useProducts()
  const productsSortedByPrice = products?.sort(sortByPrice)
  const subscriptionsSortedByPrice = subscriptions?.sort(sortByPrice)
  const [activeSubscriptionTier, setActiveSubscriptionTier] = useState<
    Creator['subscriptionTier'] | undefined
  >()

  useEffect(() => {
    setActiveSubscriptionTier(
      user?.subscriptionTier ? user?.subscriptionTier : undefined,
    )
  }, [user?.subscriptionTier])

  const onManageSubscriptionClick = async () => {
    const customerId = user?.stripeCustomerId
    if (!customerId) {
      await router.push('/account')
      return
    }
    try {
      const response = await axios.post('/api/billing/subscription', {
        stripeCustomerId: customerId,
      })
      const { url } = response.data
      await router.push(url)
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="font-mono font-bold">Subscriptions</h3>
        {!subscriptions || !subscriptions.length ? (
          <LoadingIndicator />
        ) : (
          <div>
            <div className="mb-2">
              {activeSubscriptionTier ? (
                <div>
                  Your current plan:{' '}
                  <span className="capitalize font-bold">
                    {subscriptionTierNameMap[activeSubscriptionTier]}
                  </span>
                  <Button
                    type="primary"
                    className="font-mono capitalize flex items-center"
                    onClick={onManageSubscriptionClick}
                  >
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <>
                  <div>Choose the plan that works for you:</div>
                  <div className="mt-4 container max-w-4xl space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8">
                    {subscriptionsSortedByPrice.map(product => (
                      <SubscriptionCard
                        key={product.id}
                        features={
                          dummyFeatures[
                            product.metadata
                              .subscriptionTier as SubscriptionTier
                          ]
                        }
                        subscription={product}
                        checkoutHandler={checkoutHandler}
                        isActive={
                          activeSubscriptionTier ===
                          product.metadata.subscriptionTier
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-mono font-bold">Additional Manna</h3>
        {!products || !products.length ? (
          <LoadingIndicator />
        ) : (
          <div className="flex gap-4 flex-wrap">
            {productsSortedByPrice.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                checkoutHandler={checkoutHandler}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsList
