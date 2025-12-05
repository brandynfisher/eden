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
import { useNativeWebview } from '@/hooks/use-native-webview'
import sortBy from 'lodash/sortBy'

const SubscriptionsCard = () => {
  const isNativeWebview = useNativeWebview()
  const { subscriptions } = useProductsQuery({
    enabled: !isNativeWebview,
  })

  if (isNativeWebview) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Your subscription tier.</CardDescription>
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
