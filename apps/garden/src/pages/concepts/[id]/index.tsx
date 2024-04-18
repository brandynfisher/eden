import { Page } from '@/../types/page'
import { ConceptHeadTags } from '@/components/HeadTags'
import ConceptPage from '@/components/Pages/ConceptPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import { Concept as ConceptType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'
import Error from 'next/error'
import React from 'react'

interface PageProps {
  data: { concept: ConceptType }
  error?: string
}

const fetchConcept = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'concept',
    dataFetcher: fetchConcept,
  },
])

const Concept: Page<PageProps> = ({ data }: PageProps) => {
  if (!data) {
    return <Error statusCode={404} withDarkMode={true} />
  }

  return (
    <>
      <ConceptHeadTags concept={data.concept} />
      <ConceptPage data={data} />
    </>
  )
}

export default Concept
