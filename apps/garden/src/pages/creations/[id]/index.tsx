import { fetcher } from '@/lib/fetcher'
import { Creation } from '@edenlabs/eden-sdk'
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import { getAuthHeaders } from '@/lib/auth'
import { CreationHeadTags } from '@/components/HeadTags'
import CreationPage from '@/components/Pages/CreationPage'
import { handleQueryStringRedirects } from '@/lib/ssr'
import { CldOgImage } from 'next-cloudinary'
import { capitalize } from '@/lib/string'

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

  return fetcher(`${process.env.NEXT_PUBLIC_HOST}/api/creations/${id}`, {
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
    console.error('SSR data empty - 404', repo, error)
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

  const title = `${capitalize('creation')} by ${repo.creation?.user?.username}${repo.creation.task?.generator?.generatorName ? ` | ${repo.creation.task?.generator?.generatorName}` : ''}`

  return (
    <>
      {/* //@todo: this will break for non cloudinary ASSETS! */}
      {/* //@todo: old assets need exactly the old handling... fuck */}
      <CldOgImage alt={repo.creation.name} src={repo.creation.thumbnail || ''} twitterTitle={title} title={title} assetType={repo.creation.mediaAttributes.type}/>
      <CreationHeadTags creation={repo.creation} />
      <CreationPage initialData={repo.creation} />
    </>
  )
}