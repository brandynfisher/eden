import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import {
  maybeRedirectIfConceptIdQuery,
  maybeRedirectIfCreationIdQuery,
} from '@/lib/redirect'
import CreateConceptPage from '@/pages/create/concepts/CreateConceptPage'
import { NextPageContext } from 'next'
import { AppProps } from 'next/app'
import React from 'react'

const createConcept = () => {
  return <CreateConceptPage />
}

export async function getServerSideProps(ctx: NextPageContext) {
  return (
    (await maybeRedirectIfCreationIdQuery(ctx)) ||
    (await maybeRedirectIfConceptIdQuery(ctx)) || { props: {} }
  )
}

createConcept.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutSidebar fixedHeight={true}>{page}</PageLayoutSidebar>
)

export default createConcept
