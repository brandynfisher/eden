import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import LoadingIndicator from '@/components/LoadingIndicator'
import CollectionPage from '@/pages/collections/[id]/CollectionPage'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

const Collection = () => {
  const router = useRouter()
  const { id } = router.query

  if (!id) {
    return <LoadingIndicator />
  }

  return <CollectionPage collectionId={id as string} />
}

Collection.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Collection
