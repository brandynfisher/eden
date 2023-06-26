import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

const Creator = () => {
  const router = useRouter()
  const { id } = router.query
  const creatorId = id as string
  return creatorId ? <CreatorPage creatorId={creatorId} /> : <p>Loading...</p>
}

Creator.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Creator
