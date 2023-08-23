import LoadingIndicator from '@/components/LoadingIndicator'
import ProductsList from '@/components/Products/ProductsList'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

const MannaPage = () => {
  const { message } = App.useApp()
  const { mannaBalance } = useContext(UserContext)

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

      <div className="mb-4">
        <h3 className="font-mono font-bold text-l">Subscriptions</h3>
        <div className="p-4 max-w-md rounded-lg border-solid border-green-700 bg-gray-900">
          <div>
            <div>Casual</div>
            <div>5'000 Manna / Month</div>
            <div className="flex gap-4 mt-2">
              <div className="basis-1/2 text-center p-2 rounded-lg bg-gray-800">
                <div className="text-gray-300">monthly</div>
                <div className="text-green-700">10 USD (selected)</div>
              </div>
              <div className="basis-1/2 text-center p-2 rounded-lg bg-gray-950">
                <div className="text-gray-400">yearly</div>
                <div>100 USD</div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-2 flex-wrap justify-between items-center">
            <div>
              <div className="font-bold text-green-700">ACTIVE</div>
              <div>Renews in 21 days. At 2023-08-29 9:00.</div>
            </div>
            <Button>Cancel</Button>
          </div>
        </div>
        <div>
          <div>
            <div>Pro</div>
            <div>40'000 Manna / Month</div>
            <div className="flex gap-4">
              <div>
                <div>monthly</div>
                <div>30 USD</div>
              </div>
              <div>
                <div>yearly</div>
                <div>300 USD</div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <Button className="mt-2">Subscribe</Button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <ProductsList />
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
