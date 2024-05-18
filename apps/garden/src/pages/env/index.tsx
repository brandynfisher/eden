import { fetcher } from '@/lib/fetcher'
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import { getAuthHeaders } from '@/lib/auth'
import { handleQueryStringRedirects } from '@/lib/ssr'
import CdnImage from '@/components/Media/cdn-image'
import CdnOgImage from '@/components/Media/cdn-og-image'

type Repo = {
  response: {} | null
}

type RepoResult = {
  repo: Repo,
  error?: string
}

const fetchData = async (context: GetServerSidePropsContext): Promise<{ response: {} | null }> => {
  const { req } = context

  return fetcher(`${process.env.NEXT_PUBLIC_HOST}/api/env`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (ctx): Promise<GetServerSidePropsResult<RepoResult>> => {
  try {
    const maybeRedirect = await handleQueryStringRedirects(ctx)
    if (maybeRedirect) {
      return maybeRedirect as GetServerSidePropsResult<RepoResult>
    }

    const res = await fetchData(ctx)

    if (!res) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { response: res } } }
  } catch (err) {
    return { props: { repo: { response: null }, error: 'Something went wrong' } }
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

  if (!repo || !repo.response) {
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

  return (
    <>
      <CdnOgImage alt={'123'} src={'https://res.cloudinary.com/dihgjel45/image/upload/v1715859085/creations/rvqvh7ht4qpbiptke6si.jpg'} />
      {JSON.stringify(repo)}
      <div>
        {/*<CdnImage alt={'123'} src={'/123.notfound.png'} width={64} height={64}/>*/}
        <CdnImage
          alt={'123'}
          src={'https://res.cloudinary.com/dihgjel45/image/upload/v1715859085/creations/rvqvh7ht4qpbiptke6si.jpg'}
          width={64}
          height={64}
        />
      </div>
    </>
  )
}