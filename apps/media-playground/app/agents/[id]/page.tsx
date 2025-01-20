import AgentDetail from '@/features/detail/agent-detail'
import { getAgentCached } from '@/lib/actions/agent'
import { getCloudfrontOriginalUrl } from '@/lib/media'
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

  const title = `Agent: ${response.agent.name} | Eden Create`
  const description = response.agent.description?.substring(0, 320) || ''

  const ogImage = response.agent.userImage
    ? getCloudfrontOriginalUrl(response.agent.userImage)
    : undefined

  const og: OpenGraph = {
    ...previousOg,
    title,
    description,
    images: ogImage ? [ogImage] : undefined,
  }

  const twitter: TwitterMetadata = {
    ...previousTwitter,
    title,
    description,
    images: ogImage ? [ogImage] : undefined,
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

  console.log('response', response.agent)

  return <AgentDetail id={id} agentSSRData={response.agent} />
}
