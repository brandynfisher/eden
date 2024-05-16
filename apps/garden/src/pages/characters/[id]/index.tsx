import { CharacterHeadTags } from '@/components/HeadTags'
import CharacterPage from '@/components/Pages/CharacterPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import React from 'react'
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  InferGetServerSidePropsType,
  NextApiRequest,
} from 'next'
import { Character } from '@edenlabs/eden-sdk'
import { handleQueryStringRedirects } from '@/lib/ssr'

type Repo = {
  character: Character | null
}

type RepoResult = {
  repo: Repo,
  error?: string
}

const fetchCharacter = async (context: GetServerSidePropsContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/characters/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps: GetServerSideProps<RepoResult> = async (ctx): Promise<GetServerSidePropsResult<RepoResult>> => {
  try {
    const maybeRedirect = await handleQueryStringRedirects(ctx)
    if (maybeRedirect) {
      return maybeRedirect as GetServerSidePropsResult<RepoResult>
    }

    const res = await fetchCharacter(ctx)

    if (!res || !res.character) {
      return {
        notFound: true,
      }
    }

    return { props: { repo: { character: res.character } } }
  } catch (err) {
    return { props: { repo: { character: null }, error: 'Something went wrong' } }
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

  if (!repo || !repo.character) {
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
      <CharacterHeadTags character={repo.character} />
      <CharacterPage initialData={repo.character} />
    </>
  )
}