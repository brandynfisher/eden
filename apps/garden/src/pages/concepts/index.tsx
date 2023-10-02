import PageLayoutFullWidth from '@/components/Layout/layouts/PageLayoutFullWidth'
import {
  maybeRedirectIfConceptIdQuery,
  maybeRedirectIfCreationIdQuery,
} from '@/lib/redirect'
import ConceptsPage from '@/pages/concepts/ConceptsPage'
import { NextPageContext } from 'next'
import { AppProps } from 'next/app'

export async function getServerSideProps(ctx: NextPageContext) {
  return (
    (await maybeRedirectIfCreationIdQuery(ctx)) ||
    (await maybeRedirectIfConceptIdQuery(ctx)) || { props: {} }
  )
}

const concepts = () => {
  return <ConceptsPage />
}

concepts.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutFullWidth>{page}</PageLayoutFullWidth>
)

export default concepts
