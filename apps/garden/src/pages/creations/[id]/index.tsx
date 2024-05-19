import HeadTags, { createShareTitle } from '@/components/HeadTags'
import CdnOgImageTags from '@/components/Media/cdn-og-image-tags'
import CreationPage from '@/components/Pages/CreationPage'
import { getAuthHeaders } from '@/lib/auth'
import { fetcher } from '@/lib/fetcher'
import { handleQueryStringRedirects } from '@/lib/ssr'
import { Creation } from '@edenlabs/eden-sdk'
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import React from 'react'

type Repo = {
  creation: Creation | null
}

type RepoResult = {
  repo: Repo
  error?: string
}

const fetchCreation = async (
  context: GetServerSidePropsContext,
): Promise<{ creation: Creation }> => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcher(`${process.env.NEXT_PUBLIC_HOST}/api/creations/${id}`, {
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
    const res = await fetchCreation(ctx)

    if (!res || !res.creation) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { creation: res.creation } } }
  } catch (err) {
    return {
      props: { repo: { creation: null }, error: 'Something went wrong' },
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

  if (!repo || !repo.creation) {
    console.error('SSR data empty - 404', repo, error)
    return (
      <>
        <h4>SSR data not found</h4>
        <div>SHOULD 404</div>
        <pre>{error}</pre>
      </>
    )
  }

  const title = createShareTitle({
    itemType: 'creation',
    userName: repo.creation?.user?.username,
    itemSuffix: repo.creation.task?.generator?.generatorName,
  })

  const isCloudinaryAsset = repo.creation?.thumbnail?.startsWith(
    'https://res.cloudinary.com/',
  )

  return (
    <>
      <CdnOgImageTags
        alt={repo.creation.name}
        src={repo.creation.thumbnail || ''}
        twitterTitle={title}
        twitterCard={
          repo.creation.mediaAttributes.type !== 'video'
            ? 'summary_large_image'
            : 'player'
        }
        title={title}
        assetType={repo.creation.mediaAttributes.type}
        width={
          isCloudinaryAsset ? undefined : repo.creation.mediaAttributes.width
        }
        height={
          isCloudinaryAsset ? undefined : repo.creation.mediaAttributes.height
        }
      />
      <HeadTags
        title={title}
        itemType="creation"
        item={repo.creation}
        description={
          repo.creation.mediaAttributes.type !== 'video'
            ? repo.creation.name
            : ''
        }
      />
      <CreationPage initialData={repo.creation} />
    </>
  )
}
