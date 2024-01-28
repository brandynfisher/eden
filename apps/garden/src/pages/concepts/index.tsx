import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import ConceptsPage from '@/pages/concepts/ConceptsPage'
import { NextPageContext } from 'next'

export async function getServerSideProps(ctx: NextPageContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

const concepts = () => {
  return <ConceptsPage />
}

export default concepts
