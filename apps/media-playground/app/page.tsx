import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
import { Footer } from '@/features/landing/footer'
import TrainingFeatureCard from '@/features/landing/training-feature-card'
import { getAgentCached } from '@/lib/actions/agent'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import {
  ArrowBigDownDashIcon,
  BrainCircuitIcon,
  PaletteIcon,
  PlayIcon,
  UsersIcon,
} from 'lucide-react'
import { Metadata, ResolvingMetadata } from 'next'
import Image from 'next/image'
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
          <div className="max-w-3xl mx-auto">
            <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
              The Best Creative AI Tools, All in One Place
            </TypographyH4>
            <div className="text-center text-muted-foreground">
              Our AI agents have mastered every tool in our creative tool suite,
              so you don't have to. Just share your vision, and let AI handle
              the rest.{' '}
              <Link
                href="/create"
                className=" text-purple-600 font-bold inline-flex items-center hover:text-purple-400"
              >
                Get started for free!
              </Link>
              <div className="relative flex justify-center items-center max-w-lg mx-auto mt-6">
                <Image
                  src="/temp/eve_splash.png"
                  alt="eve_splash"
                  width={2048}
                  height={2048}
                  className="rounded-lg"
                />
                <div className="absolute flex justify-center items-center bg-accent/60 rounded-full p-2">
                  <PlayIcon className="h-8 w-8 " />
                </div>
              </div>
            </div>
          </div>
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
                content={
                  <>
                    <Image
                      src="/temp/banny_train.png"
                      alt="banny_train"
                      width={2048}
                      height={2048}
                      className="rounded-lg"
                    />
                    <ArrowBigDownDashIcon className="h-9 w-9 my-2" />
                    <Image
                      src="/temp/banny.png"
                      alt="Characters"
                      width={2048}
                      height={2048}
                      className="rounded-lg"
                    />
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Create models that bring your characters to life
                    </p>
                  </>
                }
              />

              <TrainingFeatureCard
                title="Your Style"
                icon={<PaletteIcon className="h-8 w-8 text-purple-600" />}
                content={
                  <>
                    <Image
                      src="/temp/does_train.png"
                      alt="does_train"
                      width={2048}
                      height={2048}
                      className="rounded-lg"
                    />
                    <ArrowBigDownDashIcon className="h-9 w-9 my-2" />
                    <Image
                      src="/temp/does_out.png"
                      alt="does art style"
                      width={2048}
                      height={2048}
                      className="rounded-lg"
                    />
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Train models that understand and replicate your unique
                      artistic style
                    </p>
                  </>
                }
              />

              <TrainingFeatureCard
                title="Your Brand"
                icon={<BrainCircuitIcon className="h-8 w-8 text-purple-600" />}
                content={
                  <>
                    <Image
                      src="/temp/xander_train.png"
                      alt="xander_train"
                      width={2048}
                      height={2048}
                      className="rounded-lg"
                    />
                    <ArrowBigDownDashIcon className="h-9 w-9 my-2 " />
                    <Image
                      src="/temp/xander.png"
                      alt="xander face"
                      width={2048}
                      height={2048}
                      className="rounded-lg"
                    />
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Create consistent brand assets with AI that knows your
                      guidelines
                    </p>
                  </>
                }
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
          <div className="max-w-3xl mx-auto">
            <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
              Create Custom AI Agents
            </TypographyH4>
            <p className="text-center text-muted-foreground mb-4">
              Eden Agents are chat agents who are given a unique personality,
              set of tools & instructions and a custom visual model.
            </p>
            <p className="text-center text-muted-foreground">
              They can be crafted to act as creative assistants, coaches,
              storytellers, brand ambassadors and more. <br />
              <Link
                href="/explore?tab=agents&create=true"
                className="group text-purple-600 font-bold inline-flex items-center hover:text-purple-400"
              >
                Build your first agent right now!
              </Link>
            </p>
            <Image
              src="/temp/banny_chat_1.png"
              alt="banny_chat"
              width={2048}
              height={2048}
              className="rounded-lg mt-6 max-w-lg mx-auto w-full border border-secondary"
            />
          </div>
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
