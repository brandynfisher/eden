import ConceptsPage from '@/components/Pages/ConceptsPage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { GetServerSidePropsContext } from 'next'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

const concepts = () => {
  return <ConceptsPage />
}

export default concepts
