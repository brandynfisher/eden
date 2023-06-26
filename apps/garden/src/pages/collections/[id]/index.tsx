import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import CollectionPage from '@/pages/collections/[id]/CollectionPage'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

const Collection = () => {
  const router = useRouter()
  const { id } = router.query
  const collectionId = id as string
  return collectionId ? (
    <CollectionPage collectionId={collectionId} />
  ) : (
    <p>Loading...</p>
  )
}

Collection.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Collection
