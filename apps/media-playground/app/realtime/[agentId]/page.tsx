import RealtimeView from '@/features/realtime/realtime-view'
import { getAgentCached } from '@/lib/actions/agent'
import { OpenGraph, TwitterMetadata } from '@/types/OpenGraph'
import { auth } from '@clerk/nextjs/server'
import { Metadata, ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

interface Props {
  params: { agentId: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const response = await getAgentCached(params.agentId)

  if (!response?.agent) {
    return {}
  }

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `${response.agent.name} | Eden`
  const description =
    response.agent.description?.substring(0, 160) ||
    `${response.agent.name}, an AI agent on Eden`

  // Use agent's profile image for Open Graph - optimal for social media previews
  // Fallback to Eden logo if no profile image
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_HOST ||
    'https://staging.app.eden.art'
  const ogImage =
    response.agent.userImage || `${baseUrl}/eden-logo-with-text.png`

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

const RealtimePage = async ({ params }: Props) => {
  // Require authentication - redirect to sign-in if not authenticated
  const { userId } = await auth()

  if (!userId) {
    // Redirect to sign-in with return URL to come back after login
    const returnUrl = `/realtime/${params.agentId}`
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`)
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RealtimeView />
    </Suspense>
  )
}

export default RealtimePage
