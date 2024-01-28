import { Page } from '@/../types/page'
import { CreationHeadTags } from '@/components/HeadTags'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CreationPage from '@/pages/creations/[id]/CreationPage'
import { Creation } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'
import Error from 'next/error'
import React from 'react'

interface PageProps {
  data: {
    creation: Creation
  }
  error?: string
}

const fetchCreation = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creations/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'creation',
    dataFetcher: fetchCreation,
  },
])

const creation: Page<PageProps> = ({ data }: PageProps) => {
  if (!data) {
    return <Error statusCode={404} withDarkMode={true} />
  }

  return (
    <>
      <CreationHeadTags creation={data.creation} />
      <CreationPage data={data.creation} />
    </>
  )
}

export default creation
