import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import CreationPage from '@/pages/creations/[creationId]/CreationPage'
import React, { ReactNode } from 'react'

const Creation = () => {
  return <CreationPage />
}

Creation.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Creation
