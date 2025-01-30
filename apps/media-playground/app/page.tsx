import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
import { Footer } from '@/features/landing/footer'
import SectionAgents from '@/features/landing/section_agents'
import SectionEve from '@/features/landing/section_eve'
import TrainingFeatureCard from '@/features/landing/training-feature-card'
import { getAgentCached } from '@/lib/actions/agent'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { BrainCircuitIcon, PaletteIcon, UsersIcon } from 'lucide-react'
import { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
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
      {/* <div className="max-w-2xl flex flex-col flex-grow justify-center w-full gap-14 my-10"> */}
      <div className="flex flex-col flex-grow justify-center w-full gap-12 mt-6 md:mt-12">
        <section>
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

        <section className="bg-accent/60 py-12 px-4">
          <SectionEve />
        </section>

        <section>
          <div className="max-w-5xl mx-auto">
            <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
              Train Custom Models That Learn:
            </TypographyH4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mx-4">
              <TrainingFeatureCard
                icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
                title="Your Characters"
                inputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_train_v1.jpg"
                inputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_train_thumb_v1.jpg"
                outputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_v1.jpg"
                outputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/banny_thumb_v1.jpg"
                subtitle="Create models that bring your characters to life"
              />

              <TrainingFeatureCard
                icon={<PaletteIcon className="h-8 w-8 text-purple-600" />}
                title="Your Style"
                inputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_train_v1.jpg"
                inputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_train_thumb_v1.jpg"
                outputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_v1.jpg"
                outputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/does_thumb_v1.jpg"
                subtitle="Train models that understand and replicate your unique artistic style"
              />

              <TrainingFeatureCard
                icon={<BrainCircuitIcon className="h-8 w-8 text-purple-600" />}
                title="Your Brand"
                inputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_train_v1.jpg"
                inputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_train_thumb_v1.jpg"
                outputImage="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_v1.jpg"
                outputImageThumbnail="https://d14i3advvh2bvd.cloudfront.net/app/landing/home/xander_thumb_v1.jpg"
                subtitle="Create consistent brand assets with AI that knows your guidelines"
              />
            </div>
            <p className="text-center text-muted-foreground mt-6 px-4">
              Every artist or brand has their own unique style—that's why
              personalization is at the core of what we do.
              <br />
              Don't just use our models—
              <Link href="/train" className="text-purple-600 font-bold">
                train your own!
              </Link>
            </p>
          </div>
        </section>

        <section className="bg-accent/60 py-12 px-4">
          <SectionAgents />
        </section>

        <section className="mb-12 px-4">
          <div className="max-w-3xl mx-auto">
            <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
              Deploy Your Agent Wherever Your Audience Is
            </TypographyH4>
            <p className="text-center text-muted-foreground mb-6">
              Once you've built your custom agent on Eden, you can deploy it to
              platforms like Discord, X, Telegram, and Farcaster. Create
              consistent, scalable content and keep your audience engaged across
              all your favorite channels.
            </p>
            <div className="flex justify-center items-center gap-4">
              <Button variant="ghost" size={'icon'} asChild>
                <Link
                  href={siteConfig.links.discord}
                  target="_blank"
                  className="filter flex flex-col p-4 rounded-lg border border-border bg-card h-16 w-16"
                >
                  <DiscordIcon size={64} />
                </Link>
              </Button>
              <Button variant="ghost" size={'icon'} asChild>
                <Link
                  href={siteConfig.links.twitter}
                  target="_blank"
                  className="group  flex flex-col p-4 rounded-lg border border-border bg-card h-16 w-16"
                >
                  <TwitterIcon size={64} />
                </Link>
              </Button>
              {/* <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
                TG
              </div>
              <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
                FC
              </div> */}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
