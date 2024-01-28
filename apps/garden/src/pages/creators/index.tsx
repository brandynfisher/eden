import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import CreatorsPage from '@/pages/creators/CreatorsPage'
import { NextPageContext } from 'next'

const creators = () => {
  return <CreatorsPage />
}

export async function getServerSideProps(ctx: NextPageContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

export default creators
