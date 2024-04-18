import { Page } from '../../../../../types/page'
import { CreatorHeadTags } from '@/components/HeadTags'
import CreatorPage from '@/components/Pages/CreatorPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { Creator as CreatorType } from '@edenlabs/eden-sdk/dist/models/Creators'
import { NextApiRequest, NextPageContext } from 'next'
import Error from 'next/error'
import React from 'react'

interface PageProps {
  data: {
    creator: CreatorType
    tab: string
  }
  error?: string
}

const fetchCreator = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creators?creatorId=${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = async (ctx: NextPageContext) => {
  const { query } = ctx
  const tab = query.tab ? String(query.tab).trim() : false

  return {
    props: {
      data: {
        tab: tab,
        ...(await fetchCreator(ctx)),
      },
    },
  }
}

const CreatorTab: Page<PageProps> = ({ data }: PageProps) => {
  if (!data) {
    return <Error statusCode={404} withDarkMode={true} />
  }

  return (
    <>
      <CreatorHeadTags creator={data.creator} />
      <CreatorPage data={data.creator} activeTab={data.tab} />
    </>
  )
}

export default CreatorTab
