import ConceptsPage from '@/components/Pages/ConceptsPage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { GetServerSidePropsContext } from 'next'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const redirect = await maybeRedirectIfItemIdQuery(ctx)
  console.log(redirect)
  return redirect
}

const concepts = () => {
  return <ConceptsPage />
}

export default concepts
