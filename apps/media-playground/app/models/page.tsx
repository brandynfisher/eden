'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const ModelsPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve any existing search parameters and add type=models
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', 'models')
    // Update legacy ownershipType parameter to creator
    if (params.has('ownershipType')) {
      const ownershipType = params.get('ownershipType')
      params.delete('ownershipType')
      if (ownershipType !== 'public') {
        params.set('creator', ownershipType)
      }
    }
    router.replace(`/explore?${params.toString()}`)
  }, [router, searchParams])

  // Return null since we're redirecting
  return null
}

export default ModelsPage
