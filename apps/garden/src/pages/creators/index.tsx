import CreatorsPage from '@/components/Pages/CreatorsPage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { NextPageContext } from 'next'

const creators = () => {
  return <CreatorsPage />
}

export async function getServerSideProps(ctx: NextPageContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

export default creators
