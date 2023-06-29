import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import LoadingIndicator from '@/components/LoadingIndicator'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

const Creator = () => {
  const router = useRouter()
  const { id } = router.query

  if (!id) {
    return <LoadingIndicator />
  }

  return <CreatorPage creatorId={id as string} />
}

Creator.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Creator
