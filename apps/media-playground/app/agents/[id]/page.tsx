import AgentDetail from '@/features/detail/agent-detail'
import customImageLoader, { Formats } from '@/image-loader'
import { fetcher } from '@/lib/fetcher'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { AgentGetResponse } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

const getAgent = async (id: string): Promise<AgentGetResponse | undefined> => {
  try {
    const response = await fetcher<AgentGetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/agents/${id}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    )

    return response
  } catch (e) {
    console.error('Error fetching collection:', e)
    return undefined
  }
}

const getAgentCached = cache(getAgent)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.id
  const response = await getAgentCached(id || '')

  if (!response) {
    return {}
  }

  const agent = response.agent

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `Agent: ${agent?.name} | Eden Create`
  const baseDescription = ``
  const description = agent?.description.substring(0, 200) || baseDescription

  // Initialize OpenGraph metadata
  const og: OpenGraph = {
    ...previousOg,
    title,
    description: description,
    images: agent?.userImage
      ? [
          customImageLoader({
            src: agent?.userImage || '',
            width: 1024,
            format: Formats.JPG,
          }),
        ]
      : undefined,
  }

  // Initialize Twitter metadata
  const twitter: TwitterMetadata = {
    ...previousTwitter,
    title,
    description: baseDescription, // Default description for Twitter
    images: agent?.userImage
      ? [
          customImageLoader({
            src: agent?.userImage || '',
            width: 1024,
            format: Formats.JPG,
          }),
        ]
      : undefined,
  }

  twitter.card = 'summary_large_image'

  // Assemble the final metadata object
  const metadata: Metadata = {
    title,
    description: og.description, // OG description (might be empty for videos)
    openGraph: og,
    twitter: twitter,
  }

  return metadata
}

const AgentDetailPage = async ({ params: { id: agentId } }: Props) => {
  if (!agentId) {
    return notFound()
  }

  const response = await getAgentCached(agentId || '')

  if (!response || !response.agent) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return <AgentDetail id={agentId} agentSSRData={response.agent} />
}

export default AgentDetailPage
