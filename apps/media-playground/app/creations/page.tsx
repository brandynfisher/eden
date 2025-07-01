'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const CreationsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect to explore page with type=creations
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', 'creations')
    router.replace(`/explore?${params.toString()}`)
  }, [router, searchParams])

  // Return null since we're redirecting
  return null
}

export default CreationsPage
