import PageLayoutNoSidebar from '@/components/Layout/layouts/PageLayoutNoSidebar'
import LoadingIndicator from '@/components/LoadingIndicator'
import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import CreatorPage from '@/pages/creators/[id]/CreatorPage'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

export async function getServerSideProps(ctx: NextPageContext) {
  return (await maybeRedirectIfCreationIdQuery(ctx)) || { props: {} }
}

const Creator = () => {
  const router = useRouter()
  const { id } = router.query
  const idParam = id as string

  if (!idParam) {
    return <LoadingIndicator />
  }

  return <CreatorPage creatorId={idParam} />
}

Creator.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}

export default Creator
