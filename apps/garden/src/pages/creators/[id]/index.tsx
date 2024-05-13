import { Page } from '../../../../types/page'
import { CreatorHeadTags } from '@/components/HeadTags'
import CreatorPage from '@/components/Pages/CreatorPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import { Creator as CreatorType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'
import Error from 'next/error'
import React from 'react'

interface PageProps {
  data: {
    creator: CreatorType
  }
  error?: string
}

const fetchCreator = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creators/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'creator',
    dataFetcher: fetchCreator,
  },
])

const Creator: Page<PageProps> = ({ data }: PageProps) => {
  if (!data) {
    return <Error statusCode={404} withDarkMode={true} />
  }

  return (
    <>
      <CreatorHeadTags creator={data.creator} />
      <CreatorPage data={data.creator} activeTab={'creations'} />
    </>
  )
}

export default Creator
