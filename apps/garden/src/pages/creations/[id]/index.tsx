import { Page } from '@/../types/page'
import PageLayoutNoSidebar from '@/components/Layout/layouts/PageLayoutNoSidebar'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import CreationPage from '@/pages/creations/[id]/CreationPage'
import { Creation as CreationType } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'
import { ReactNode } from 'react'

interface PageProps {
  data: CreationType
  error?: string
}

const fetchCreation = async (context: NextPageContext) => {
  const { query } = context
  const creationId = query.id ? String(query.id).trim() : false

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/creations?creationId=${creationId}`,
  )
}

const getServerSidePropsBase = (
  responseFieldName: string,
  dataFetcher: (ctx: NextPageContext) => Promise<{ [key: string]: string }>,
) => {
  return async (ctx: NextPageContext) => {
    await maybeRedirectIfCreationIdQuery(ctx)

    try {
      const data = await dataFetcher(ctx)

      if (!data || !data[responseFieldName]) {
        return {
          notFound: true,
        }
      }

      return { props: { data: data[responseFieldName] } }
    } catch (err) {
      return { props: { error: 'Something went wrong' } }
    }
  }
}

export const getServerSideProps = getServerSidePropsBase(
  'creation',
  fetchCreation,
)

const Creation: Page<PageProps> = ({ data }: PageProps) => {
  return <CreationPage data={data} />
}

Creation.getLayout = (page: ReactNode) => {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Creation
