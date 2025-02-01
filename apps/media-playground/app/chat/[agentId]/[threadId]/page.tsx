import Chat from '@/features/chat/chat'
import { getAgentCached } from '@/lib/actions/agent'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: {
    agentId: string
    threadId: string
  }
}

export async function generateMetadata(
  { params: { agentId } }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const response = await getAgentCached(agentId)

  if (!response?.agent) {
    return {}
  }

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `Chat with ${response.agent.name} | Eden`
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

const ChatAgentThreadPage = async ({
  params: { agentId, threadId },
}: Props) => {
  const response = await getAgentCached(agentId)

  if (!response?.agent) {
    return <div>Agent not found</div>
  }

  return (
    <Chat agentSSRData={response.agent} agentId={agentId} threadId={threadId} />
  )
}

export default ChatAgentThreadPage
