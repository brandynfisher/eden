import CreatorsPage from '@/components/Pages/CreatorsPage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { GetServerSidePropsContext} from 'next'

const creators = () => {
  return <CreatorsPage />
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

export default creators
