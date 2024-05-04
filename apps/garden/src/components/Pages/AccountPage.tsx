import DiscordAuthButton from '@/components/DiscordAuthButton'
import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import LoadingIndicator from '@/components/LoadingIndicator'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { AddShoppingCartOutlined } from '@mui/icons-material'
import KeyOutlined from '@mui/icons-material/KeyOutlined'
import { App, Collapse } from 'antd'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import React, { useContext } from 'react'
import { sendGTMEvent } from '@next/third-parties/google'

const { Panel } = Collapse

const ApiKeys = dynamic(() => import('@/components/ApiKeys'), {
  loading: () => <LoadingIndicator />,
})

const ProductsList = dynamic(
  () => import('@/components/Products/ProductsList'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const AccountPage = () => {
  const { message } = App.useApp()
  const { hasMinimumSubscriptionTier } = useContext(UserContext)
  const hasApiAccessPermission = hasMinimumSubscriptionTier(
    SubscriptionTier.Pro,
  )

  const handleCheckout = async (priceId: string, paymentMode: string) => {
    try {
      const response = await axios.post('/api/payment', {
        priceId,
        paymentMode,
      })
      const { url } = response.data

      sendGTMEvent({
        event: 'begin_checkout',
        event_callback: () => {
          window.location.href = url
        },
        eventTimeout : 2000
      })
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <>
      <div className="w-full grid grid-cols-12">
        <div className="flex flex-col space-y-4 col-span-12 xl:col-span-11 mb-4">
          <Collapse
            expandIconPosition="start"
            defaultActiveKey={'subscription'}
          >
            <Panel
              key={'subscription'}
              header={'Subscription & Manna'}
              extra={<AddShoppingCartOutlined />}
            >
              <div className="mb-4">
                <ProductsList checkoutHandler={handleCheckout} />
              </div>
            </Panel>
            <Panel
              key={'discord'}
              header={'Discord Account'}
              extra={<SvgDiscord />}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3>Linking your Discord account to Eden:</h3>
                  <ul className="pl-4">
                    <li>
                      Enables attribution of creations made with our discord
                      bots to your profile
                    </li>
                  </ul>
                </div>
                <DiscordAuthButton />
              </div>
            </Panel>
            <Panel key={'apiKeys'} header={'API Keys'} extra={<KeyOutlined />}>
              {hasApiAccessPermission ? (
                <ApiKeys />
              ) : (
                <div className="text-gray-500">
                  Only pro+ subscribers can create API keys. Please upgrade your{' '}
                  <Link href="/manna" className="font-bold">
                    subscription
                  </Link>
                  .
                </div>
              )}
            </Panel>
          </Collapse>
        </div>
      </div>
    </>
  )
}

export default AccountPage
