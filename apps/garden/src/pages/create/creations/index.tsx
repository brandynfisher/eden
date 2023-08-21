import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateCreationsPage from '@/pages/create/creations/CreateCreationsPage'
import React, { ReactNode } from 'react'

const createCreations = () => {
  return <CreateCreationsPage />
}

createCreations.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutSidebar>{page}</PageLayoutSidebar>
}

export default createCreations
