'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const AgentsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', 'agents')
    router.replace(`/explore?${params.toString()}`)
  }, [router, searchParams])

  // Return null since we're redirecting
  return null
}

export default AgentsPage
