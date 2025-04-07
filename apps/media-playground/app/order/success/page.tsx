'use client'

import { sendGTMEvent } from '@next/third-parties/google'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const OrderSuccessPage = () => {
  const router = useRouter()

  useEffect(() => {
    sendGTMEvent({
      event: 'success_checkout',
    })
    router.push('/settings/subscription?state=success')
  }, [router])
}

export default OrderSuccessPage
