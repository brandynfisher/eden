import LoadingIndicator from '@/components/LoadingIndicator'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App } from 'antd'
import axios from 'axios'
import dynamic from 'next/dynamic'
import React, { useContext } from 'react'
import { getGAClientIdFromCookie, trackBeginCheckout } from '@/lib/analytics'

const ProductsList = dynamic(
  () => import('@/components/Products/ProductsList'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const MannaPage = () => {
  const { message } = App.useApp()
  const { mannaBalance, isAuthenticated } = useContext(UserContext)

  const handleCheckout = async (priceId: string, paymentMode: string) => {
    try {
      const analyticsClientId = getGAClientIdFromCookie()

      const response = await axios.post('/api/payment', {
        priceId,
        paymentMode,
        analyticsClientId
      })
      const { url } = response.data

      trackBeginCheckout(url)
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <div>
      <div className="mb-4">
        {typeof mannaBalance !== 'undefined' ? (
          <>
            You currently have <span className="font-bold">{mannaBalance}</span>{' '}
            Manna
          </>
        ) : isAuthenticated ? (
          <LoadingIndicator />
        ) : null}
      </div>
      <div className="mb-4">
        <ProductsList checkoutHandler={handleCheckout} />
      </div>
    </div>
  )
}

export default MannaPage
