import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CollectionPage from '@/pages/collections/[id]/CollectionPage'
import { Collection as CollectionType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'
import React from 'react'

import { Page } from '../../../../types/page'

interface PageProps {
  data: CollectionType
  error?: string
}

const fetchCollection = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/collections?collectionId=${id}`,
    {
      headers: await getAuthHeaders(req as NextApiRequest),
    },
  )
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'collection',
    dataFetcher: fetchCollection,
  },
])

const Collection: Page<PageProps> = ({ data }: PageProps) => {
  return <CollectionPage data={data} />
}

export default Collection
