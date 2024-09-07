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

const mannaCapTierMap = {
  0: 0,
  1: 1000,
  2: 5000,
  3: 10000,
  4: 0,
}

const dummyFeatures: { [key in SubscriptionTier]: string[] } = {
  0: [],
  1: [
    '1,000 Manna / month',
    '10% Discount on Manna-Refills',
    '3 concurrent creation jobs',
    // 'Private creations',
  ],
  2: [
    '5,000 Manna / month',
    '20% Discount on Manna-Refills',
    '6 concurrent creation jobs',
    // 'Private creations',
    'API access',
    'Premium generators',
    'Export Concepts for use in other apps',
  ],
  3: [
    '10,000 Manna / month',
    '30% Discount on Manna-Refills',
    '10 concurrent creation jobs',
    // 'Private creations',
    'API access',
    'Premium generators',
    'Export Concepts for use in other apps',
    'Early access to preview features',
    'Priority support',
  ],
  4: [],
}

const ProductsList = ({
  checkoutHandler,
}: {
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const {
    mannaBalance,
    mannaForeverBalance,
    mannaSubscriptionBalance,
    isAuthenticated,
  } = useContext(UserContext)
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
        <h3 className="font-mono font-bold">Manna</h3>
        <div>
          <div className="mb-2">Your current Manna Balance:</div>
          {typeof mannaBalance !== 'undefined' ? (
            <div>
              <span className="font-bold">{mannaBalance}</span> total
              <ul className="px-6">
                {activeSubscriptionTier ? (
                  <li>
                    {typeof mannaSubscriptionBalance !== 'undefined' ? (
                      <div>
                        <span>{mannaSubscriptionBalance}</span> from your
                        subscription plan{' '}
                        <span>
                          (refills to a cap of{' '}
                          <strong>
                            {mannaCapTierMap[activeSubscriptionTier]}
                          </strong>{' '}
                          Manna at the next billing cycle)
                        </span>
                      </div>
                    ) : isAuthenticated ? (
                      <LoadingIndicator />
                    ) : null}
                  </li>
                ) : null}
                <li>
                  {typeof mannaForeverBalance !== 'undefined' ? (
                    <div>
                      <span>{mannaForeverBalance}</span> non-expiring
                    </div>
                  ) : isAuthenticated ? (
                    <LoadingIndicator />
                  ) : null}
                </li>
              </ul>
            </div>
          ) : isAuthenticated ? (
            <LoadingIndicator />
          ) : null}
        </div>
      </div>
      <div className="mb-8">
        <h3 className="font-mono font-bold">Subscriptions</h3>
        {!subscriptions || !subscriptions.length ? (
          <LoadingIndicator />
        ) : (
          <div>
            <div className="mb-2">
              {activeSubscriptionTier ? (
                <div className="mb-8">
                  <div className="mb-4">
                    Your current plan:{' '}
                    <span className="capitalize font-bold">
                      {subscriptionTierNameMap[activeSubscriptionTier]}
                    </span>
                  </div>

                  <Button
                    type="primary"
                    className="font-mono capitalize flex items-center "
                    onClick={onManageSubscriptionClick}
                  >
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <>
                  <div>Choose the plan that works for you:</div>
                </>
              )}
            </div>
            <div className="mt-4 container flex flex-wrap gap-4">
              {subscriptionsSortedByPrice.map(product => (
                <SubscriptionCard
                  key={product.id}
                  features={
                    dummyFeatures[
                      product.metadata.subscriptionTier as SubscriptionTier
                    ]
                  }
                  subscription={product}
                  checkoutHandler={checkoutHandler}
                  isActive={
                    activeSubscriptionTier ===
                    Number(product.metadata.subscriptionTier)
                  }
                  hasActiveSubscription={
                    typeof activeSubscriptionTier !== 'undefined'
                  }
                />
              ))}
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
