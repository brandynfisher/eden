import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
import { Footer } from '@/features/landing/footer'
import { getAgentCached } from '@/lib/actions/agent'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

type Props = {
  params: {}
}
export async function generateMetadata(
  // eslint-disable-next-line no-unused-vars
  { params: _test }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const response = await getAgentCached(siteConfig.featured.agents[0])

  if (!response?.agent) {
    return {}
  }

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `Chat with ${response.agent.name} | Eden Create`
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

const HomePage = async () => {
  const response = await getAgentCached(siteConfig.featured.agents[0])

  if (!response?.agent) {
    return notFound()
  }

  if (response.error) {
    throw new Error(`Error loading agent: ${response.error}`)
  }

  return (
    <div className="flex flex-col items-center h-full justify-between flex-grow">
      <div className="max-w-lg flex flex-col flex-grow justify-center w-full">
        {/* <h1 className="text-2xl font-semibold mt-12 mb-4">Welcome</h1> */}
        <div className="min-w-[320px] flex flex-col p-4 border border-purple-600/40 rounded-lg bg-muted-darker/50">
          <ChatMockWidget
            agentId={siteConfig.featured.agents[0]}
            agentSSRData={response.agent}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
