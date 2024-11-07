import AssistantDetail from '@/features/detail/assistant-detail'
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

const getAssistant = async (
  id: string,
): Promise<AgentGetResponse | undefined> => {
  try {
    const response = await fetcher<AgentGetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/assistants/${id}`,
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

const getAssistantCached = cache(getAssistant)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.id
  const response = await getAssistantCached(id || '')

  if (!response) {
    return {}
  }

  const assistant = response.agent

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `Assistant: ${assistant?.name} | Eden Create`
  const baseDescription = `Check out this assistant by ${assistant?.user.username}!`
  const description = assistant?.description

  // Initialize OpenGraph metadata
  const og: OpenGraph = {
    ...previousOg,
    title,
    description: description,
    images: assistant?.image
      ? [
          customImageLoader({
            src: assistant?.image || '',
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
    images: assistant?.image
      ? [
          customImageLoader({
            src: assistant?.image || '',
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

const AssistantDetailPage = async ({ params: { id: assistantId } }: Props) => {
  if (!assistantId) {
    return notFound()
  }

  const response = await getAssistantCached(assistantId || '')

  if (!response || !response.agent) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return <AssistantDetail id={assistantId} assistantSSRData={response.agent} />
}

export default AssistantDetailPage
