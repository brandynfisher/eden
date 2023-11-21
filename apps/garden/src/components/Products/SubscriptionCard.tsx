import { Product } from '@edenlabs/eden-sdk'
import { Button, Card } from 'antd'
import Image from 'next/image'

const { Meta } = Card

export const renderDisplayPrice = (subscription: Product, suffix?: string) => {
  const { displayPrice } = subscription
  return (
    <div>
      {displayPrice.currency.toUpperCase()}{' '}
      <strong>
        {(displayPrice?.unit_amount
          ? displayPrice?.unit_amount / 100
          : 0
        ).toFixed(2)}
      </strong>
      <span className="text-xs">{suffix ? suffix : null}</span>
    </div>
  )
}

const SubscriptionCard = ({
  subscription,
  checkoutHandler,
  isActive,
}: {
  subscription: Product
  isActive: boolean
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const handleSubscribeClick = () => {
    checkoutHandler(subscription.default_price, 'subscription')
  }

  const handleCancelClick = () => {
    // checkoutHandler(subscription.default_price, 'subscription')
  }

  return (
    <Card
      className={`w-72 ${isActive ? 'border-green-700' : ''}`}
      cover={
        <Image
          width={256}
          height={256}
          alt={subscription.name || ''}
          src={
            subscription.images && subscription.images.length
              ? subscription.images[0]
              : '/eden-logo-512x512.png'
          }
          className="bg-gray-100 dark:bg-gray-800 "
        />
      }
      actions={[
        <div
          key={subscription.id}
          className="px-4 flex gap-2 justify-between items-center"
        >
          {isActive ? (
            <Button danger type="dashed" onClick={handleCancelClick}>
              Cancel
            </Button>
          ) : (
            <Button onClick={handleSubscribeClick}>Subscribe</Button>
          )}
          {renderDisplayPrice(subscription, ' / month')}
        </div>,
      ]}
    >
      <Meta
        title={
          <div className="flex gap-2 flex-wrap justify-between">
            <span>{subscription.name || ''}</span>
            {isActive ? (
              <span className="font-bold text-green-700">Active</span>
            ) : null}
          </div>
        }
        description={subscription.description}
      />
    </Card>
  )

  // return (
  //   <div
  //     className={`p-4 max-w-md rounded-lg border-solid bg-gray-200 dark:bg-gray-900 ${
  //       isActive ? 'border-green-700' : 'border-gray-600'
  //     } `}
  //     title={subscription.description || ''}
  //   >
  //     <div className="text-center">
  //       {/*<div className="font-bold">{subscription.name}</div>*/}
  //       <div>{subscription.description}</div>
  //       {/*{subscription.items ? (*/}
  //       {/*  <SubscriptionCardPlans*/}
  //       {/*    plans={subscription?.items?.data}*/}
  //       {/*    selectedPlan={selectedPlan}*/}
  //       {/*    onPlanSelect={plan => setSelectedPlan(plan)}*/}
  //       {/*  />*/}
  //       {/*) : (*/}
  //       {/*  <div>default item</div>*/}
  //       {/*)}*/}
  //     </div>
  //     <div className="mt-4">
  //       {isActive ? (
  //         <div className="flex gap-2 flex-wrap justify-between items-center">
  //           <div>
  //             <div className="font-bold text-green-700">ACTIVE</div>
  //             {/*<div>Renews in X days. At 20XX-XX-XX XX:XX.</div>*/}
  //           </div>
  //           <Button danger type="dashed" onClick={handleCancelClick}>Cancel</Button>
  //         </div>
  //       ) : (
  //         <div className="flex justify-center">
  //           <Button onClick={handleSubscribeClick}>Subscribe</Button>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // )
}

export default SubscriptionCard
