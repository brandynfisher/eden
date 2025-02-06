import { Footer } from '@/features/landing/footer'
import SectionAgents from '@/features/landing/section-agents'
import SectionChatMock from '@/features/landing/section-chat-mock'
import SectionDeploy from '@/features/landing/section-deploy'
import SectionEve from '@/features/landing/section-eve'
import SectionTraining from '@/features/landing/section-training'
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

  const title = `Eden | Creative AI Suite`
  const description =
    'Express your ideas with Eden, a comprehensive collection of creative AI tools for generating and editing images, video, and audio. '

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
            <SectionChatMock />
          </section>
        ) : null}

        <section className="bg-accent/60 py-12 px-4">
          <SectionDeploy />
        </section>

        <section>
          <SectionEve />
        </section>

        <section className="bg-accent/60 py-12 px-4">
          <SectionTraining />
        </section>

        <section className="mb-12 px-4">
          <SectionAgents />
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
