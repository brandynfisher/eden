import { Page } from '@/../types/page'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CreationPage from '@/pages/creations/[id]/CreationPage'
import { Creation as CreationType } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'

interface PageProps {
  data: CreationType
  error?: string
}

const fetchCreation = async (context: NextPageContext) => {
  const { query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creations/${id}`)
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'creation',
    dataFetcher: fetchCreation,
  },
])

const Creation: Page<PageProps> = ({ data }: PageProps) => {
  return <CreationPage data={data} />
}

export default Creation
