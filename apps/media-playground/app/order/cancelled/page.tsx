'use client'

import { useRouter } from 'next/navigation'

const OrderCancelledPage = () => {
  const router = useRouter()
  router.push('/settings/subscription?state=cancelled')
}

export default OrderCancelledPage
