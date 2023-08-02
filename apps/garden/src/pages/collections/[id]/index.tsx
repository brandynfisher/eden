import PageLayoutDefault from '@/components/Layout/layouts/PageLayoutDefault'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CollectionPage from '@/pages/collections/[id]/CollectionPage'
import { Collection as CollectionType } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'
import React, { ReactNode } from 'react'

import { Page } from '../../../../types/page'

interface PageProps {
  data: CollectionType
  error?: string
}

const fetchCollection = async (context: NextPageContext) => {
  const { query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/collections?collectionId=${id}`,
  )
}

export const getServerSideProps = getServerSidePropsBase(
  'collection',
  fetchCollection,
)

const Collection: Page<PageProps> = ({ data }: PageProps) => {
  return <CollectionPage data={data} />
}

Collection.getLayout = (page: ReactNode) => {
  return <PageLayoutDefault>{page}</PageLayoutDefault>
}

export default Collection
