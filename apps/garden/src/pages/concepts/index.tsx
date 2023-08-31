import {
  maybeRedirectIfConceptIdQuery,
  maybeRedirectIfCreationIdQuery,
} from '@/lib/redirect'
import ConceptsPage from '@/pages/ConceptsPage'
import { NextPageContext } from 'next'

export async function getServerSideProps(ctx: NextPageContext) {
  return (
    (await maybeRedirectIfCreationIdQuery(ctx)) ||
    (await maybeRedirectIfConceptIdQuery(ctx)) || { props: {} }
  )
}

const concepts = () => {
  return <ConceptsPage />
}

export default concepts
