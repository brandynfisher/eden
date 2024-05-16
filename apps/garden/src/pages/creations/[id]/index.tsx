import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import { CONFIG } from '@/lib/config'
import { getAuthHeaders } from '@/lib/auth'
import { CreationHeadTags } from '@/components/HeadTags'
import CreationPage from '@/components/Pages/CreationPage'
import { handleQueryStringRedirects } from '@/lib/ssr'

type Repo = {
  creation: Creation | null
}

type RepoResult = {
  repo: Repo,
  error?: string
}

const fetchCreation = async (context: GetServerSidePropsContext): Promise<{ creation: Creation }> => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcher(`${CONFIG.NEXT_PUBLIC_HOST}/api/creations/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (ctx): Promise<GetServerSidePropsResult<RepoResult>> => {
  try {
    const maybeRedirect = await handleQueryStringRedirects(ctx)
    if (maybeRedirect) {
      return maybeRedirect as GetServerSidePropsResult<RepoResult>
    }

    const res = await fetchCreation(ctx)

    if (!res || !res.creation) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { creation: res.creation } } }
  } catch (err) {
    return { props: { repo: { creation: null }, error: 'Something went wrong' } }
  }
}

export default function Page({
  repo, error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (error) {
    console.error('SSR error', repo, error)
    return (
      <>
        <h4>SSR ERROR</h4>
        <pre>
          {error}
        </pre>
      </>
    )
  }

  if (!repo || !repo.creation) {
    console.error('SSR data empty', repo, error)
    return (
      <>
        <h4>SSR data not found</h4>
        <div>SHOULD 404</div>
        <pre>
          {error}
        </pre>
      </>
    )
  }

  return (
    <>
      <CreationHeadTags creation={repo.creation} />
      <CreationPage initialData={repo.creation} />
    </>
  )
}