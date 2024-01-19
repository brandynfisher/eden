import { Page } from '../../../../types/page'
import { CreatorHeadTags } from '@/components/HeadTags'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { Creator as CreatorType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'

interface PageProps {
  data: {
    creator: CreatorType
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

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'creator',
    dataFetcher: fetchCreator,
  },
])

const Creator: Page<PageProps> = ({ data }: PageProps) => {
  return (
    <>
      <CreatorHeadTags creator={data.creator} />
      <CreatorPage data={data.creator} />
    </>
  )
}

export default Creator
