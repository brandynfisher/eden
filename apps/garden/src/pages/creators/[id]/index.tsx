import PageLayoutFullWidth from '@/components/Layout/layouts/PageLayoutFullWidth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { Creator as CreatorType } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'
import { AppProps } from 'next/app'

import { Page } from '../../../../types/page'

interface PageProps {
  data: CreatorType
  error?: string
}

const fetchCreator = async (context: NextPageContext) => {
  const { query } = context
  const id = query.id ? String(query.id).trim() : false

  console.log('id', id)
  console.log('CONFIG.NEXT_PUBLIC_HOST', CONFIG.NEXT_PUBLIC_HOST)
  // lol
  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creators?creatorId=${id}`)
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'creator',
    dataFetcher: fetchCreator,
  },
])

const Creator: Page<PageProps> = ({ data }: PageProps) => {
  return <CreatorPage data={data} />
}

Creator.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutFullWidth>{page}</PageLayoutFullWidth>
)

export default Creator
