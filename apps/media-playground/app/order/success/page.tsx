'use client'

import { useRouter } from 'next/navigation'

const OrderSuccessPage = () => {
  const router = useRouter()
  router.push('/settings/subscription?state=success')
}

export default OrderSuccessPage
