import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateConceptPage from '@/pages/create/concepts/CreateConceptPage'
import React, { ReactNode } from 'react'

const createConcept = () => {
  return <CreateConceptPage />
}

createConcept.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutSidebar>{page}</PageLayoutSidebar>
}

export default createConcept
