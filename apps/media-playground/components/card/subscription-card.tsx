import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthState } from '@/hooks/use-auth-state'
import { handleAxiosServerError } from '@/lib/fetcher'
import { Product, SubscriptionTier } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { cx } from 'class-variance-authority'
import currency from 'currency.js'
import { CheckIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const discountFactorMap: { [key in SubscriptionTier]: number } = {
  0: 1,
  1: 0.9,
  2: 0.8,
  3: 0.7,
  4: 1,
}

export const renderDisplayPrice = (
  product: Product,
  subscriptionTier?: SubscriptionTier,
) => {
  const { displayPrice } = product
  const discountFactor = discountFactorMap[subscriptionTier || 0]
  const originalPrice = currency(displayPrice?.unit_amount || 0, {
    fromCents: true,
  }).format({
    symbol: '$',
  })
  const discountedPrice = currency(displayPrice?.unit_amount || 0, {
    fromCents: true,
  })
    .multiply(discountFactor)
    .format({
      symbol: '$',
    })

  return (
    <div className="font-semibold text-2xl">
      {discountFactor < 1 ? (
        <>
          <span className="line-through font-normal">{originalPrice}</span>
          {' ' + discountedPrice}
        </>
      ) : (
        discountedPrice
      )}
    </div>
  )
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

const SubscriptionCard = ({ product }: { product: Product }) => {
  const { user } = useAuthState()

  const isActive =
    user?.subscriptionTier === parseInt(product.metadata.subscriptionTier)

  const handleCheckout = async (priceId: string) => {
    try {
      const response = await axios.post('/api/account/payment', {
        requestType: 'checkout',
        priceId,
        paymentMode: 'subscription',
      })
      const { url } = response.data

      window.location.href = url
    } catch (error) {
      handleAxiosServerError(error)
    }
  }

  const handleManageClick = async () => {
    const customerId = user?.stripeCustomerId
    if (!customerId) {
      toast.warning('Could not find customer. Please contact support.', {
        duration: 5000,
        richColors: true,
        closeButton: true,
      })
      return
    }
    try {
      const response = await axios.post('/api/account/payment', {
        requestType: 'manage',
        stripeCustomerId: customerId,
      })
      const { url } = response.data
      window.location.href = url
    } catch (error) {
      handleAxiosServerError(error)
    }
  }

  return (
    <Card
      className={cx(
        'flex flex-col w-full relative',
        isActive ? '!border-success bg-success/10' : '',
      )}
    >
      {isActive && (
        <div className="absolute -top-3 bg-success rounded-md h-6 px-4 left-1/2 -translate-x-1/2 text-center text-xs font-semibold leading-6">
          Active
        </div>
      )}
      <CardHeader className="!p-4 space-y-2">
        <CardTitle>{product.name}</CardTitle>
        <div className="mt-4 flex items-center">
          <span className="text-4xl font-extrabold tracking-tight">
            {renderDisplayPrice(product)}
          </span>
          <span className="ml-1 text-md font-semibold text-muted-foreground">
            / month
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-0 flex flex-col justify-between flex-1">
        <div className="space-y-2 px-4">
          {dummyFeatures[
            product.metadata.subscriptionTier as SubscriptionTier
          ].map(feature => (
            <div className="flex gap-x-2" key={feature}>
              <CheckIcon className="w-4 h-4 text-success" />
              <p className="text-sm -mt-0.5 w-full">{feature}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <Button
          className="w-full"
          variant={isActive ? 'default' : 'secondary'}
          onClick={() => {
            if (isActive) {
              handleManageClick()
            } else {
              handleCheckout(product.default_price)
            }
          }}
        >
          {isActive
            ? 'Manage Subscription'
            : user?.subscriptionTier === 0
            ? 'Subscribe'
            : 'Change to this plan'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SubscriptionCard
