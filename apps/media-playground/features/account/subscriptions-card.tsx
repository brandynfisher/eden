'use client'

import SubscriptionCard from '@/components/card/subscription-card'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useProductsQuery } from '@/hooks/query/use-products-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useNativeWebview } from '@/hooks/use-native-webview'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import sortBy from 'lodash/sortBy'

const SubscriptionsCard = () => {
  const isNativeWebview = useNativeWebview()
  const { user } = useAuthState()
  const { subscriptions } = useProductsQuery({
    enabled: !isNativeWebview,
  })
  const isFreePlan =
    !user?.subscriptionTier ||
    (user.subscriptionTier as SubscriptionTier) === SubscriptionTier.Free

  if (isNativeWebview) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          {isFreePlan
            ? "You're currently on the free plan. Subscribe to unlock more features."
            : 'Your subscription tier.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {sortBy(subscriptions, 'displayPrice.unit_amount', 'asc').map(
            subscription => (
              <SubscriptionCard key={subscription.id} product={subscription} />
            ),
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SubscriptionsCard
