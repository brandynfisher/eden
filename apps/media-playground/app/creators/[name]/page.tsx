import LoadingIndicator from '@/components/loading-indicator'
import ProfileHeader from '@/features/profile/profile-header'
import ProfileTabs from '@/features/profile/profile-tabs'
import { fetcher } from '@/lib/fetcher'
import { Agent, CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense, cache } from 'react'

type Props = {
  params: {
    name: string
  }
}

// Fetch a creator (user). If not found, attempt agent fetch and adapt agent to creator shape.
const getUser = async (name: string) => {
  try {
    // Attempt user fetch (suppress individual fetch errors)
    const userResponse = await fetcher<CreatorsGetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/users/${name}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    ).catch(() => undefined)

    if (userResponse?.creator) return userResponse

    // Attempt agent fetch (suppress individual fetch errors)
    const agentResponse = await fetcher<{ agent: Agent }>(
      `${process.env.NEXT_PUBLIC_HOST}/api/agents/${name}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    ).catch(() => undefined)

    if (agentResponse?.agent) {
      const agent = agentResponse.agent as any
      const adapted: CreatorsGetResponse = {
        creator: {
          _id: agent._id,
          userId: agent.username || agent.userId,
          username: agent.username || name,
          userImage: agent.userImage || '',
          createdAt: agent.createdAt || new Date().toISOString(),
          followerCount: agent.followerCount || 0,
          followingCount: agent.followingCount || 0,
          creationCount: agent.creationCount || 0,
          instagramHandle: undefined,
          twitterHandle: undefined,
          type: 'agent',
        } as any,
      }
      return adapted
    }

    return undefined
  } catch (_) {
    return undefined
  }
}

const getUserCached = cache(getUser)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const name = params.name

  // fetch data
  const creatorResponse = await getUserCached(name || '')

  if (!creatorResponse) {
    return {}
  }

  // optionally access and extend (rather than replace) parent metadata
  const previousOg: OpenGraph | {} = (await parent).openGraph || {}

  const title = `${creatorResponse.creator?.username} | Eden`
  const description = ``

  return {
    // ...(await parent),
    title,
    description,
    openGraph: {
      ...previousOg,
      title,
      description,
      images: creatorResponse.creator?.userImage
        ? [creatorResponse.creator?.userImage]
        : undefined,
    },
  }
}

const CreatorProfilePage = async ({ params: { name } }: Props) => {
  if (!name) {
    return notFound()
  }

  const creatorResponse = await getUserCached(name || '')

  if (!creatorResponse || !creatorResponse.creator) {
    return notFound()
  }

  if (creatorResponse.error) {
    return <div>error response: {String(creatorResponse.error)}</div>
  }

  return (
    <>
      <ProfileHeader name={name} creatorSSRData={creatorResponse.creator} />
      <Suspense fallback={<LoadingIndicator />}>
        <ProfileTabs />
      </Suspense>
    </>
  )
}

export default CreatorProfilePage
