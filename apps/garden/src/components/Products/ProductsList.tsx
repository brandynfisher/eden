import LoadingIndicator from '@/components/LoadingIndicator'
import SubscriptionCard from '@/components/Products/SubscriptionCard'
import { useProducts } from '@/hooks/useProducts'
import { UserContext } from '@/providers/UserProvider'
import { Creator, Product } from '@edenlabs/eden-sdk'
import dynamic from 'next/dynamic'
import React, { useContext, useEffect, useState } from 'react'

const ProductCard = dynamic(() => import('@/components/Products/ProductCard'), {
  loading: () => <LoadingIndicator />,
})

const sortByPrice = (a: Product, b: Product) => {
  const aPrice = a.displayPrice.unit_amount
  const bPrice = b.displayPrice.unit_amount
  return aPrice > bPrice ? 1 : -1
}

const dummyFeatures: { [key: string]: string[] } = {
  basic: [
    '1000 Manna / month',
    'Powered by GPT-4 (more accurate)',
    'API access',
  ],
  pro: [
    '5000 Manna / month',
    'Powered by GPT-4 (more accurate)',
    'API access',
    'Private Creations',
    'Fast Generations',
  ],
}

const ProductsList = ({
  checkoutHandler,
}: {
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
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
                    {activeSubscriptionTier}
                  </span>
                </div>
              ) : (
                'No active plan'
              )}
            </div>
            <div className="mt-4 container max-w-4xl space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8">
              {subscriptionsSortedByPrice.map(product => (
                <SubscriptionCard
                  key={product.id}
                  features={dummyFeatures[product.metadata.subscriptionTier]}
                  subscription={product}
                  checkoutHandler={checkoutHandler}
                  isActive={
                    activeSubscriptionTier === product.metadata.subscriptionTier
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-mono font-bold">Products</h3>
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
