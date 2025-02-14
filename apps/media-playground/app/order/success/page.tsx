'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const OrderSuccessPage = () => {
  useEffect(() => {
    sendGTMEvent({
      event: 'success_checkout',
    })
  }, [])

  const router = useRouter()
  router.push('/settings/subscription?state=success')
}

export default OrderSuccessPage
