import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import LoadingIndicator from '@/components/LoadingIndicator'
import CreationPage from '@/pages/creations/[id]/CreationPage'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

const Creation = () => {
  const router = useRouter()
  const { id } = router.query

  if (!id) {
    return <LoadingIndicator />
  }

  return <CreationPage creationId={id as string} />
}

Creation.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Creation
