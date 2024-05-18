import HeadTags from '@/components/HeadTags'
import CreatorPage from '@/components/Pages/CreatorPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import {
  type GetServerSideProps,
  type GetServerSidePropsContext, type GetServerSidePropsResult,
  type InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import React from 'react'
import { Creator } from '@edenlabs/eden-sdk'
import { handleQueryStringRedirects } from '@/lib/ssr'
import CdnOgImage from '@/components/Media/cdn-og-image'
import { possessivy } from '@/lib/string'

type Repo = {
  creator: Creator | null
  tab: string
}

type RepoResult = {
  repo: Repo,
  error?: string
}


const fetchCreator = async (context: GetServerSidePropsContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creators/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (ctx): Promise<GetServerSidePropsResult<RepoResult>> => {
  const { query } = ctx
  const tab = query.tab && query.tab.length ? String(query.tab[0]).trim() : 'creations'

  try {
    const maybeRedirect = await handleQueryStringRedirects(ctx)
    if (maybeRedirect) {
      return maybeRedirect as GetServerSidePropsResult<RepoResult>
    }

    const res = await fetchCreator(ctx)

    if (!res || !res.creator) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { creator: res.creator, tab } } }
  } catch (err) {
    return { props: { repo: { creator: null, tab }, error: 'Something went wrong' } }
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

  if (!repo || !repo.creator) {
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

  const title = `${possessivy(repo.creator.username || '')} Profile`

  return (
    <>
      <CdnOgImage
        alt={repo.creator.username || ''}
        src={repo.creator.userImage || ''}
        twitterTitle={title}
        title={title}
      />
      <HeadTags
        title={title}
        itemType='creator'
        item={repo.creator}
        description={`${repo.creator.creationsCount} Creations | ${repo.creator.followerCount} Followers`}
      />
      <CreatorPage initialData={repo.creator} activeTab={repo.tab} />
    </>
  )
}
