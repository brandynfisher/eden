import { handleAxiosError } from '@/lib/fetcher'
import { App, Button } from 'antd'
import axios from 'axios'
import React from 'react'

const MannaPage = () => {
  const { message } = App.useApp()

  const handleCheckout = async () => {
    try {
      const response = await axios.post('/api/payment', {
        priceId: 'price_1Nfj5lDX4Emx2YPCa100zNaR',
      })
      const { url } = response.data
      window.location.href = url
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <div>
      <Button onClick={handleCheckout}>Buy 1000 Manna</Button>
    </div>
  )
}

export default MannaPage
