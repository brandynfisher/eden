import CollectionPage from '@/pages/collections/[id]/CollectionPage'
import { useRouter } from 'next/router'
import React from 'react'

const collection = () => {
  const router = useRouter()
  const { id } = router.query
  const collectionId = id as string
  return collectionId ? (
    <CollectionPage collectionId={collectionId} />
  ) : (
    <p>Loading...</p>
  )
}

export default collection
