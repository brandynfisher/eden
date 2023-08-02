import PageLayoutDefault from '@/components/Layout/layouts/PageLayoutDefault'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { Creator as CreatorType } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'
import { ReactNode } from 'react'

import { Page } from '../../../../types/page'

interface PageProps {
  data: CreatorType
  error?: string
}

const fetchCreator = async (context: NextPageContext) => {
  const { query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creators?creatorId=${id}`)
}

export const getServerSideProps = getServerSidePropsBase(
  'creator',
  fetchCreator,
)

const Creator: Page<PageProps> = ({ data }: PageProps) => {
  return <CreatorPage data={data} />
}

Creator.getLayout = (page: ReactNode) => {
  return <PageLayoutDefault>{page}</PageLayoutDefault>
}

export default Creator
