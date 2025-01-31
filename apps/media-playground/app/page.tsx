import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
import { Footer } from '@/features/landing/footer'
import SectionDeploy from '@/features/landing/section-deploy'
import SectionTraining from '@/features/landing/section-training'
import SectionAgents from '@/features/landing/section_agents'
import SectionEve from '@/features/landing/section_eve'
import { getAgentCached } from '@/lib/actions/agent'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { Metadata, ResolvingMetadata } from 'next'

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

  return (
    <div className="flex flex-col items-center h-full justify-between flex-grow">
      {/* <div className="max-w-2xl flex flex-col flex-grow justify-center w-full gap-14 my-10"> */}
      <div className="flex flex-col flex-grow justify-center w-full gap-12 ">
        {response?.agent ? (
          <section className="mt-6 md:mt-12">
            <div className="max-w-3xl mx-auto px-4">
              <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
                Meet Eve: your AI assistant for transforming ideas into art and
                stories.
              </TypographyH4>
              <div className="flex justify-center">
                <div className="max-w-lg min-w-[320px] md:mx-0 flex flex-col p-4 border border-purple-600/40 rounded-lg bg-muted-darker/50">
                  <ChatMockWidget
                    agentId={siteConfig.featured.agents[0]}
                    agentSSRData={response.agent}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-accent/60 py-12 px-4">
          <SectionEve />
        </section>

        <section>
          <SectionTraining />
        </section>

        <section className="bg-accent/60 py-12 px-4">
          <SectionAgents />
        </section>

        <section className="mb-12 px-4">
          <SectionDeploy />
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
