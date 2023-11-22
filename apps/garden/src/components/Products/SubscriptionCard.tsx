import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Product } from '@edenlabs/eden-sdk'
import CheckIcon from '@mui/icons-material/Check'
import { App, Badge } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import { ReactElement, useContext } from 'react'

export const renderDisplayPrice = (subscription: Product, suffix?: string) => {
  const { displayPrice } = subscription
  return (
    <div>
      {/*{displayPrice.currency.toUpperCase()}{' '}*/}
      {'$'}
      <strong>
        {(displayPrice?.unit_amount
          ? displayPrice?.unit_amount / 100
          : 0
        ).toFixed(0)}
      </strong>
      <span className="text-xs">{suffix ? suffix : null}</span>
    </div>
  )
}

const SubscriptionFeatures = ({ features }: { features: string[] }) => {
  if (!features) {
    return null
  }

  return (
    <ul role="list" className="pl-0 mt-6 space-y-4">
      {features.map((feature: string, index: number) => (
        <li key={index} className="flex">
          <CheckIcon className="text-green-700" />
          <span className="ml-3 ">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

const CardComponent = ({
  subscription,
  features,
  actionButton,
  isActive,
}: {
  subscription: Product
  features: string[]
  actionButton: ReactElement
  isActive?: boolean
}) => {
  return (
    <div
      className={`relative h-full p-4 md:p-8 border border-solid rounded-xl shadow-sm flex flex-col ${
        isActive
          ? 'bg-gray-100 dark:bg-gray-900 border-blue-600'
          : 'border-gray-200 dark:border-gray-700 '
      }`}
    >
      <div className="flex-1">
        <h3 className="text-xl font-semibold">{subscription.name}</h3>
        {/*<p className="absolute top-0 py-1.5 px-4 bg-emerald-500 text-white dark:text-black rounded-full text-xs font-semibold uppercase tracking-wide  transform -translate-y-1/2">*/}
        {/*  Most popular*/}
        {/*</p>*/}
        <p className="mt-4 flex items-baseline ">
          <span className="text-4xl font-extrabold tracking-tight">
            {renderDisplayPrice(subscription)}
          </span>
          <span className="ml-1 text-xl font-semibold">/ month</span>
        </p>
        <p className="mt-4">{subscription.description}</p>
        <SubscriptionFeatures features={features} />
      </div>
      {actionButton}
    </div>
  )
}

const SubscriptionCard = ({
  subscription,
  features,
  checkoutHandler,
  isActive,
}: {
  subscription: Product
  features: string[]
  isActive: boolean
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const { user } = useContext(UserContext)
  const router = useRouter()
  const { message } = App.useApp()

  const handleSubscribeClick = () => {
    checkoutHandler(subscription.default_price, 'subscription')
  }

  const handleManageClick = async () => {
    const customerId = user?.stripeCustomerId
    if (!customerId) {
      message.destroy()
      message.warning('Could not find customer. Please contact support.', 5)
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

  if (isActive) {
    return (
      <Badge.Ribbon text="Active" color="#2463eb">
        <CardComponent
          isActive={true}
          subscription={subscription}
          features={features}
          actionButton={
            <div className="mt-8">
              {/*<div className="">*/}
              {/*  <div>Renews in X days. At 20XX-XX-XX XX:XX.</div>*/}
              {/*</div>*/}
              <div
                onClick={handleManageClick}
                className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-6 mt-4 block w-full cursor-pointer border border-transparent rounded-md text-center font-medium"
              >
                Manage
              </div>
            </div>
          }
        />
      </Badge.Ribbon>
    )
  }

  return (
    <CardComponent
      subscription={subscription}
      features={features}
      actionButton={
        <div
          onClick={handleSubscribeClick}
          className="bg-emerald-500 text-white hover:bg-emerald-600 py-2 px-6 mt-8 block w-full cursor-pointer border border-transparent rounded-md text-center font-medium"
        >
          Subscribe
        </div>
      }
    />
  )
}

export default SubscriptionCard
