import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateCreationsPage from '@/pages/create/creations/CreateCreationsPage'
import { AppProps } from 'next/app'
import React from 'react'

const createCreations = () => {
  return <CreateCreationsPage />
}

createCreations.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutSidebar fixedHeight={true}>{page}</PageLayoutSidebar>
)

export default createCreations
