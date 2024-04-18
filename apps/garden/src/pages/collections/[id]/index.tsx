import { Page } from '../../../../types/page'
import { CollectionHeadTags } from '@/components/HeadTags'
import CollectionPage from '@/components/Pages/CollectionPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import { Collection as CollectionType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'
import React from 'react'

interface PageProps {
  data: {
    collection: CollectionType
  }
  error?: string
}

const fetchCollection = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/collections/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'collection',
    dataFetcher: fetchCollection,
  },
])

const Collection: Page<PageProps> = ({ data }: PageProps) => {
  return (
    <>
      <CollectionHeadTags collection={data.collection} />
      <CollectionPage data={data.collection} />
    </>
  )
}

export default Collection
