import { CollectionHeadTags } from '@/components/HeadTags'
import CollectionPage from '@/components/Pages/CollectionPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { handleQueryStringRedirects } from '@/lib/ssr'
import {
  type GetServerSideProps,
  GetServerSidePropsContext, type GetServerSidePropsResult,
  type InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import React from 'react'
import { Collection } from '@edenlabs/eden-sdk'

type Repo = {
  collection: Collection | null
}

type RepoResult = {
  repo: Repo,
  error?: string
}


const fetchCollection = async (context: GetServerSidePropsContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/collections/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (ctx): Promise<GetServerSidePropsResult<RepoResult>> => {
  try {
    const maybeRedirect = await handleQueryStringRedirects(ctx)
    if (maybeRedirect) {
      return maybeRedirect as GetServerSidePropsResult<RepoResult>
    }

    const res = await fetchCollection(ctx)

    if (!res || !res.collection) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { collection: res.collection } } }
  } catch (err) {
    return { props: { repo: { collection: null }, error: 'Something went wrong' } }
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

  if (!repo || !repo.collection) {
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
      <CollectionHeadTags collection={repo.collection} />
      <CollectionPage initialData={repo.collection} />
    </>
  )
}