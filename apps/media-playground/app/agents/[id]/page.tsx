import AgentDetail from '@/features/detail/agent-detail'
import { getAgentCached } from '@/lib/actions/agent'
import { getCloudfrontUrl } from '@/lib/media'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const response = await getAgentCached(params.id)

  if (!response?.agent) {
    return {}
  }

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `${response.agent.name} | Eden`
  const description =
    response.agent.description?.substring(0, 160) ||
    `${response.agent.name}, an AI agent on Eden`

  // Use resized image (1200px) for Open Graph - optimal for social media previews
  // Fallback to Eden logo if no profile image
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eden.art'
  const ogImage = response.agent.userImage
    ? getCloudfrontUrl(response.agent.userImage, 1200)
    : `${baseUrl}/eden-logo-with-text.png`

  const og: OpenGraph = {
    ...previousOg,
    title,
    description,
    images: [ogImage],
    type: 'profile',
  }

  const twitter: TwitterMetadata = {
    ...previousTwitter,
    title,
    description,
    images: [ogImage],
    card: 'summary_large_image',
  }

  return {
    title,
    description: og.description,
    openGraph: og,
    twitter,
  }
}

export default async function AgentDetailPage({ params: { id } }: Props) {
  const response = await getAgentCached(id)

  if (!response?.agent) {
    return notFound()
  }

  if (response.error) {
    throw new Error(`Error loading agent: ${response.error}`)
  }

  // console.log('response', response.agent)

  return <AgentDetail id={id} agentSSRData={response.agent} />
}
