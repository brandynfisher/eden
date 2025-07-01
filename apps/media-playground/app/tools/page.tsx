'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ToolsPage = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace('/create')
  }, [router])

  // Return null since we're redirecting
  return null
}

export default ToolsPage
