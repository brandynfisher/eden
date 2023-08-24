import { CheckOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'
import type { Stripe } from 'stripe'

// {/*<div>*/}
// {/*  <div>*/}
// {/*    <div>Pro</div>*/}
// {/*    <div>40'000 Manna / Month</div>*/}
// {/*    <div className="flex gap-4">*/}
// {/*      <div>*/}
// {/*        <div>monthly</div>*/}
// {/*        <div>30 USD</div>*/}
// {/*      </div>*/}
// {/*      <div>*/}
// {/*        <div>yearly</div>*/}
// {/*        <div>300 USD</div>*/}
// {/*      </div>*/}
// {/*    </div>*/}
// {/*  </div>*/}
// {/*  <div className="mt-2 flex justify-between">*/}
// {/*    <Button className="mt-2">Subscribe</Button>*/}
// {/*  </div>*/}
// {/*</div>*/}

const SubscriptionCardPlans = ({
  plans,
  selectedPlan,
  onPlanSelect,
}: {
  plans: Stripe.SubscriptionItem[]
  selectedPlan: Stripe.SubscriptionItem
  onPlanSelect: (plan: Stripe.SubscriptionItem) => void
}) => {
  const isActivePlan = false

  const handleChangeSelectedPlan = (plan: Stripe.SubscriptionItem) => {
    onPlanSelect(plan)
  }

  return (
    <div className="flex gap-4 mt-4">
      {plans.map(plan => (
        <div
          key={plan.id}
          className={`basis-1/2 text-center p-2 rounded-lg ${
            selectedPlan.id !== plan.id
              ? 'cursor-pointer bg-gray-600 dark:bg-gray-950'
              : 'bg-gray-400 dark:bg-gray-800'
          }`}
          onClick={() => handleChangeSelectedPlan(plan)}
        >
          <div className="dark:text-gray-300">
            {plan?.price?.recurring?.interval}
          </div>
          <div
            className={`font-bold font-mono ${
              isActivePlan ? 'text-green-700' : ''
            } flex-shrink-0`}
          >
            <div>
              {plan?.price?.unit_amount
                ? (plan?.price?.unit_amount / 100).toFixed(2)
                : 0}
            </div>
            <div>{plan?.price?.currency.toUpperCase()}</div>
            {isActivePlan ? <CheckOutlined /> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

const SubscriptionCard = ({
  subscription,
  checkoutHandler,
}: {
  subscription: Stripe.Subscription
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const isActiveSubscription = false
  const [selectedPlan, setSelectedPlan] = useState<Stripe.SubscriptionItem>(
    subscription?.items?.data[0],
  )

  const onSubscribeClick = () => {
    checkoutHandler(selectedPlan.id, 'subscription')
  }

  return (
    <div
      className={`p-4 max-w-md rounded-lg border-solid bg-gray-200 dark:bg-gray-900 ${
        isActiveSubscription ? 'border-green-700' : 'border-gray-600'
      } `}
      title={subscription.description || ''}
    >
      <div className="text-center">
        <div className="font-bold">{subscription.name}</div>
        <div>{subscription.description}</div>
        {subscription.items ? (
          <SubscriptionCardPlans
            plans={subscription?.items?.data}
            selectedPlan={selectedPlan}
            onPlanSelect={plan => setSelectedPlan(plan)}
          />
        ) : (
          <div>default item</div>
        )}
      </div>
      <div className="mt-4">
        {isActiveSubscription ? (
          <div className="flex gap-2 flex-wrap justify-between items-center">
            <div>
              <div className="font-bold text-green-700">ACTIVE</div>
              <div>Renews in 21 days. At 2023-08-29 9:00.</div>
            </div>
            <Button>Cancel</Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button onClick={onSubscribeClick}>Subscribe</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionCard
