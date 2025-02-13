'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const OrderCancelledPage = () => {
  useEffect(() => {
    sendGTMEvent({
      event: 'cancel_checkout',
    })
  }, [])

  const router = useRouter()
  router.push('/settings/subscription?state=cancelled')
}

export default OrderCancelledPage
