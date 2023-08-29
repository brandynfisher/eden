import LoadingIndicator from '@/components/LoadingIndicator'
import ProductsList from '@/components/Products/ProductsList'
// import SubscriptionsList from '@/components/Subscriptions/SubscriptionsList'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Button } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const MannaPage = () => {
  const { message } = App.useApp()
  const { mannaBalance, user } = useContext(UserContext)
  const router = useRouter()

  const handleCheckout = async (priceId: string, paymentMode: string) => {
    try {
      const response = await axios.post('/api/payment', {
        priceId,
        paymentMode,
      })
      const { url } = response.data
      window.location.href = url
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  const [isPreviewUser, setIsPreviewUser] = useState<boolean | undefined>(
    undefined,
  )

  useEffect(() => {
    if (user && user.featureFlags) {
      if (user.featureFlags.includes('preview')) {
        setIsPreviewUser(true)
      } else {
        router.replace(`/`)
      }
    }
  }, [user?.featureFlags])

  if (typeof isPreviewUser === 'undefined') {
    return <LoadingIndicator />
  }

  return (
    <div>
      <div className="mb-4">
        {typeof mannaBalance !== 'undefined' ? (
          <>
            You currently have <span className="font-bold">{mannaBalance}</span>{' '}
            Manna
          </>
        ) : (
          <LoadingIndicator />
        )}
      </div>

      {/*<div className="mb-4">*/}
      {/*  <SubscriptionsList checkoutHandler={handleCheckout} />*/}
      {/*</div>*/}

      <div className="mb-4">
        <ProductsList checkoutHandler={handleCheckout} />
      </div>

      {/* dev / debug */}
      <Button
        onClick={() =>
          handleCheckout('price_1Nfj5lDX4Emx2YPCa100zNaR', 'payment')
        }
      >
        Buy 1000 Manna
      </Button>

      <Button
        onClick={() =>
          handleCheckout('price_1NiGSTDX4Emx2YPCRccbteTp', 'subscription')
        }
      >
        Subscribe
      </Button>
    </div>
  )
}

export default MannaPage
