import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import LoadingIndicator from '@/components/LoadingIndicator'
import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import CollectionPage from '@/pages/collections/[id]/CollectionPage'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactNode } from 'react'

export async function getServerSideProps(ctx: NextPageContext) {
  return (await maybeRedirectIfCreationIdQuery(ctx)) || { props: {} }
}

const Collection = () => {
  const router = useRouter()
  const { id } = router.query

  if (!id) {
    return <LoadingIndicator />
  }

  return <CollectionPage collectionId={id as string} />
}

Collection.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Collection
