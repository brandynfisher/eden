import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateConceptPage from '@/components/Pages/CreateConceptPage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { NextPageContext } from 'next'
import { AppProps } from 'next/app'
import React from 'react'

const createConcept = () => {
  return <CreateConceptPage />
}

export async function getServerSideProps(ctx: NextPageContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

createConcept.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutSidebar fixedHeight={true}>{page}</PageLayoutSidebar>
)

export default createConcept
