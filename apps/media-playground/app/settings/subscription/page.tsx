'use client'

import TypographyH4 from '@/components/ui/typography/TypographyH4'
import MannaCard from '@/features/account/manna-card'
import MobileSubscriptionNotice from '@/features/account/mobile-subscription-notice'
import { OrderStateCard } from '@/features/account/order-state-card'
import SubscriptionsCard from '@/features/account/subscriptions-card'
import { useNativeWebview } from '@/hooks/use-native-webview'

const SettingsSubscriptionsPage = () => {
  const isNativeWebview = useNativeWebview()

  if (isNativeWebview) {
    return (
      <>
        <TypographyH4>Subscription & Manna</TypographyH4>
        <MobileSubscriptionNotice />
      </>
    )
  }

  return (
    <>
      <TypographyH4>Subscription & Manna</TypographyH4>
      <SubscriptionsCard />
      <MannaCard />
      <OrderStateCard />
    </>
  )
}

export default SettingsSubscriptionsPage
