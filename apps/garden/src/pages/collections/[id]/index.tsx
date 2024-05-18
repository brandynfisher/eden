import HeadTags from '@/components/HeadTags'
import CdnOgImageTags from '@/components/Media/cdn-og-image-tags'
import CollectionPage from '@/components/Pages/CollectionPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { handleQueryStringRedirects } from '@/lib/ssr'
import { Collection } from '@edenlabs/eden-sdk'
import {
  type GetServerSideProps,
  GetServerSidePropsContext,
  type GetServerSidePropsResult,
  type InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import React from 'react'

type Repo = {
  collection: Collection | null
}

type RepoResult = {
  repo: Repo
  error?: string
}

const fetchCollection = async (context: GetServerSidePropsContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/collections/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (
  ctx,
): Promise<GetServerSidePropsResult<RepoResult>> => {
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
    return {
      props: { repo: { collection: null }, error: 'Something went wrong!' },
    }
  }
}

export default function Page({
  repo,
  error,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (error) {
    console.error('SSR error', repo, error)
    return (
      <>
        <h4>SSR ERROR</h4>
        <pre>{error}</pre>
      </>
    )
  }

  if (!repo || !repo.collection) {
    console.error('SSR data empty', repo, error)
    return (
      <>
        <h4>SSR data not found</h4>
        <div>SHOULD 404</div>
        <pre>{error}</pre>
      </>
    )
  }

  const title = `Collection "${repo.collection.name}" by ${repo.collection.creatorName} | Garden of Eden`

  return (
    <>
      <CdnOgImageTags
        alt={`${repo.collection.name} - Collection by ${repo.collection.creatorName}`}
        src={repo.collection.displayImageUri || ''}
        twitterTitle={title}
        title={title}
        width={1024}
        height={1024}
      />
      <HeadTags
        title={title}
        description={`${repo.collection.creations.length} creations curated by ${repo.collection.creatorName}`}
        itemType="collection"
        item={repo.collection}
      />
      <CollectionPage initialData={repo.collection} />
    </>
  )
}
