import CreationDetail from '@/features/detail/creation-detail'
import { fetcher } from '@/lib/fetcher'
import { CreationsV2GetResponse, MediaType } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

const getCreation = async (id: string) => {
  const response = await fetcher<CreationsV2GetResponse>(
    `${process.env.NEXT_PUBLIC_HOST}/api/creations/${id}`,
    { credentials: 'include' },
  )

  return response
}

const getCreationCached = cache(getCreation)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const id = params.id

  // fetch data
  const creationResponse = await getCreationCached(id || '')

  // optionally access and extend (rather than replace) parent metadata
  const previousOg: OpenGraph | {} = (await parent).openGraph || {}

  const title = `Creation by ${creationResponse.creation?.user.username} | Garden of Eden`
  const description = ``
  const media: { images?: string[]; videos?: string[] } = {}
  if (creationResponse.creation?.mediaAttributes?.type === MediaType.Video) {
    media.videos = creationResponse.creation?.url
      ? [creationResponse.creation?.url]
      : undefined
  } else {
    media.images = creationResponse.creation?.url
      ? [creationResponse.creation?.url]
      : undefined
  }

  return {
    // ...(await parent),
    title,
    description,
    openGraph: {
      ...previousOg,
      title,
      description,
      ...media,
    },
  }
}

const CreationDetailPage = async ({ params: { id: creationId } }: Props) => {
  if (!creationId) {
    return <div>creationId missing</div>
  }

  const creationResponse = await getCreationCached(creationId || '')

  if (!creationResponse || !creationResponse.creation) {
    return <div>empty response</div>
  }

  if (creationResponse.error) {
    return <div>error response: {String(creationResponse.error)}</div>
  }

  return (
    <CreationDetail
      id={creationId}
      creationSSRData={creationResponse.creation}
    />
  )
}

export default CreationDetailPage
