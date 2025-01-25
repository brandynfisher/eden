import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
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
      <div className="flex flex-col flex-grow justify-center w-full gap-14 my-10">
        <section>
          <TypographyH4 className="text-2xl font-semibold mt-2 mb-6 text-center">
            Meet Eve: your AI assistant for transforming ideas into art and
            stories.
          </TypographyH4>
          <div className="flex justify-center">
            <div className="max-w-lg *:min-w-[320px] mx-2 md:mx-0flex flex-col p-4 border border-purple-600/40 rounded-lg bg-muted-darker/50">
              <ChatMockWidget
                agentId={siteConfig.featured.agents[0]}
                agentSSRData={response.agent}
              />
            </div>
          </div>
        </section>

        <section className="bg-accent/70">
          <div className="max-w-2xl mx-auto">
            <TypographyH4 className="text-2xl font-semibold mt-2 mb-6 text-center">
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
            </div>
          </div>
        </section>

        <section>
          <TypographyH4 className="text-2xl font-semibold mt-2 mb-6 text-center">
            Train custom models that learn:
          </TypographyH4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-card">
              <div className="mb-2">
                <BrainCircuitIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Your Style</h3>
              <p className="text-sm text-muted-foreground text-center">
                Train models that understand and replicate your unique artistic
                style
              </p>
            </div>

            <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-card">
              <div className="mb-2">
                <PaletteIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Your Brand</h3>
              <p className="text-sm text-muted-foreground text-center">
                Create consistent brand assets with AI that knows your
                guidelines
              </p>
            </div>

            <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-card">
              <div className="mb-2">
                <UsersIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Your Characters</h3>
              <p className="text-sm text-muted-foreground text-center">
                Develop AI models that bring your characters to life
              </p>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-6">
            Every artist or brand has their own unique style—that's why
            personalization is at the core of what we do. Don't just use our
            models—{' '}
            <Link href="/train" className="text-purple-600 font-bold">
              train your own!
            </Link>
          </p>
        </section>

        <section>
          <TypographyH4 className="text-2xl font-semibold mt-2 mb-6 text-center">
            Create Your Own Custom AI Agents
          </TypographyH4>
          <p className="text-center text-muted-foreground mb-4">
            Build chat agents with their own unique personality, specialized
            tools, custom instructions and access to your custom models.
          </p>
          <p className="text-center text-muted-foreground">
            They're perfect as creative assistants, coaches, storytellers, brand
            ambassadors—you name it. <br />
            <Link
              href="/explore?tab=agents&create=true"
              className="group text-purple-600 font-bold inline-flex items-center hover:text-purple-400"
            >
              Start building your first agent today!
            </Link>
          </p>
        </section>

        <section>
          <TypographyH4 className="text-2xl font-semibold mt-2 mb-6 text-center">
            Deploy Your Agent Wherever Your Audience Is
          </TypographyH4>
          <p className="text-center text-muted-foreground mb-4">
            Once you've built your custom agent on Eden, you can deploy it to
            platforms like Discord, X, Telegram, and Farcaster. Create
            consistent, scalable content and keep your audience engaged across
            all your favorite channels.
          </p>
          <div className="flex justify-center items-center gap-4">
            <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
              Discord
            </div>
            <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
              X
            </div>
            <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
              Telegram
            </div>
            <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
              Farcaster
            </div>
          </div>
        </section>
      </div>
      {/* <Footer /> */}
    </div>
  )
}

export default HomePage
