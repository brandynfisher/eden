import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateConceptPage from '@/pages/create/concepts/CreateConceptPage'
import { AppProps } from 'next/app'
import React from 'react'

const createConcept = () => {
  return <CreateConceptPage />
}

createConcept.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutSidebar fixedHeight={true}>{page}</PageLayoutSidebar>
)

export default createConcept
