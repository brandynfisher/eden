import LoadingIndicator from '@/components/LoadingIndicator'
import SubscriptionCard from '@/components/Subscriptions/SubscriptionCard'
import { useSubscriptions } from '@/hooks/useSubscriptions'

const SubscriptionsList = ({
  checkoutHandler,
}: {
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const { subscriptions } = useSubscriptions()

  return (
    <div>
      <h3 className="font-mono font-bold text-l">Subscriptions</h3>
      {!subscriptions || !subscriptions.length ? (
        <LoadingIndicator />
      ) : (
        <div className="flex gap-4">
          {subscriptions.map(subscription => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              checkoutHandler={checkoutHandler}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SubscriptionsList
