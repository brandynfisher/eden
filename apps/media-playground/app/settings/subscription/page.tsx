import TypographyH4 from '@/components/ui/typography/TypographyH4'
import MannaCard from '@/features/account/manna-card'
import SubscriptionsCard from '@/features/account/subscriptions-card'

const SettingsSubscriptionsPage = () => {
  return (
    <>
      <TypographyH4>Subscription & Manna</TypographyH4>
      <SubscriptionsCard />
      <MannaCard />
    </>
  )
}

export default SettingsSubscriptionsPage
