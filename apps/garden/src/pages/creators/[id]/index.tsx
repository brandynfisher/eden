import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { useRouter } from 'next/router'
import React from 'react'

const creator = () => {
  const router = useRouter()
  const { id } = router.query
  const creatorId = id as string
  return creatorId ? <CreatorPage creatorId={creatorId} /> : <p>Loading...</p>
}

export default creator
