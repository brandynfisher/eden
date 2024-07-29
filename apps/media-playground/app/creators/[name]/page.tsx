import ProfileHeader from '@/features/profile/profile-header'
import ProfileTabs from '@/features/profile/profile-tabs'
import { fetcher } from '@/lib/fetcher'
import { CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { cache } from 'react'

type Props = {
  params: {
    name: string
  }
}

const getUser = async (name: string) => {
  const response = await fetcher<CreatorsGetResponse>(
    `${process.env.NEXT_PUBLIC_HOST}/api/users/${name}`,
  )

  return response
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

  // optionally access and extend (rather than replace) parent metadata
  const previousOg: OpenGraph | {} = (await parent).openGraph || {}

  const title = `${creatorResponse.creator?.username} | Garden of Eden`
  const description = `User Profile Description`

  return {
    // ...(await parent),
    title,
    description,
    openGraph: {
      ...previousOg,
      title,
      description,
      // images: ['/some-specific-page-image.jpg', ...previousOg.images],
    },
  }
}

const CreatorProfilePage = async ({ params: { name } }: Props) => {
  if (!name) {
    return <div>name missing</div>
  }

  const creatorResponse = await getUserCached(name || '')

  if (!creatorResponse || !creatorResponse.creator) {
    return <div>empty response</div>
  }

  if (creatorResponse.error) {
    return <div>error response: {String(creatorResponse.error)}</div>
  }

  return (
    <>
      <ProfileHeader name={name} creatorInitData={creatorResponse.creator} />
      <ProfileTabs creator={creatorResponse.creator} />
    </>
  )
}

export default CreatorProfilePage
