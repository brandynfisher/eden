import CreationDetail from '@/features/detail/creation-detail'
import customImageLoader, { Formats } from '@/image-loader'
import { fetcher } from '@/lib/fetcher'
import { getCloudfrontUrl } from '@/lib/media'
import { OpenGraph, OpenGraphVideo } from '@/types/OpenGraph'
import { CreationsV2GetResponse, MediaType } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

const getCreation = async (id: string) => {
  try {
    const response = await fetcher<CreationsV2GetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/creations/${id}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    )

    return response
  } catch (e) {
    return
  }
}

const getCreationCached = cache(getCreation)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.id
  const response = await getCreationCached(id || '')

  if (!response) {
    return {}
  }

  const previousOg = (await parent).openGraph || {}

  const title = `${response.creation?.workflow} by ${response.creation?.user.username} | Eden Create`
  // const description = `Check out the latest creation by ${response.creation?.user.username}!`
  const description = ``

  const og: OpenGraph = {
    ...previousOg,
    title,
    description,
    images: response.creation?.thumbnail
      ? [
          customImageLoader({
            src: response.creation?.thumbnail || '',
            width: 1024,
            format: Formats.JPG,
          }),
        ]
      : undefined,
  }

  if (
    response.creation?.output_type === MediaType.Video &&
    response.creation.url
  ) {
    const videoUrl = getCloudfrontUrl(response.creation.url)

    const video: OpenGraphVideo = {
      url: videoUrl,
      secureUrl: videoUrl,
      type: response.creation.mediaAttributes?.mimeType || 'video/mp4',
      width: response.creation.mediaAttributes?.width || 1024,
      height: response.creation.mediaAttributes?.height || 1024,
    }

    og.type = 'video.other' // Specify the OG type as video
    og.videos = [video]
  }

  return {
    title,
    description,
    openGraph: og,
  }
}

const CreationDetailPage = async ({ params: { id: creationId } }: Props) => {
  if (!creationId) {
    return notFound()
  }

  const creationResponse = await getCreationCached(creationId || '')

  if (!creationResponse || !creationResponse.creation) {
    return notFound()
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
