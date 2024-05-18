import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateCreationsPage from '@/components/Pages/CreateCreationsPage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { GetServerSidePropsContext } from 'next'
import { AppProps } from 'next/app'
import React from 'react'

const createCreations = () => {
  return <CreateCreationsPage />
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

createCreations.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutSidebar fixedHeight={true}>{page}</PageLayoutSidebar>
)

export default createCreations
