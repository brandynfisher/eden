import { fetcher } from '@/lib/fetcher'
import { Concept } from '@edenlabs/eden-sdk'
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import { CONFIG } from '@/lib/config'
import { getAuthHeaders } from '@/lib/auth'
import HeadTags, { createShareTitle } from '@/components/HeadTags'
import ConceptPage from '@/components/Pages/ConceptPage'
import { handleQueryStringRedirects } from '@/lib/ssr'
import CdnOgImage from '@/components/Media/cdn-og-image'
import React from 'react'

type Repo = {
  concept: Concept | null
}

type RepoResult = {
  repo: Repo,
  error?: string
}

const fetchConcept = async (context: GetServerSidePropsContext): Promise<{ concept: Concept}> => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcher(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (ctx): Promise<GetServerSidePropsResult<RepoResult>> => {
  try {
    const maybeRedirect = await handleQueryStringRedirects(ctx)
    if (maybeRedirect) {
      return maybeRedirect as GetServerSidePropsResult<RepoResult>
    }

    const res = await fetchConcept(ctx)

    if (!res || !res.concept) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { concept: res.concept } } }
  } catch (err) {
    return { props: { repo: { concept: null }, error: 'Something went wrong' } }
  }
}

export default function Page({
  repo, error
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

  if (!repo || !repo.concept) {
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

  const title = createShareTitle({
    itemType: 'concept',
    itemName: repo.concept.name,
    userName: repo.concept?.user?.username || '',
  })

  return (
    <>
      <CdnOgImage
        alt={repo.concept.name}
        src={repo.concept.thumbnail || ''}
        twitterTitle={title}
        title={title}
      />
      <HeadTags
        title={title}
        itemType='concept'
        item={repo.concept}
        description={repo.concept.description || ''}
      />
      <ConceptPage initialData={repo.concept} />
    </>
  )
}