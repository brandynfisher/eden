import CreationDetail from '@/features/detail/creation-detail'
import customImageLoader, { Formats } from '@/image-loader'
import { fetcher } from '@/lib/fetcher'
import { getCloudfrontUrl } from '@/lib/media'
import { OpenGraph, OpenGraphVideo, TwitterMetadata } from '@/types/OpenGraph'
import { CreationsV2GetResponse, MediaType } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

const getCreation = async (
  id: string,
): Promise<CreationsV2GetResponse | undefined> => {
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
    console.error('Error fetching creation:', e)
    return undefined
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
  const previousTwitter = (await parent).twitter || {}

  const title = `${response.creation?.workflow} by ${response.creation?.user.username} | Eden Create`
  const baseDescription = `Check out the latest creation by ${response.creation?.user.username}!`
  const description = response.creation?.args.prompt || baseDescription

  // Initialize OpenGraph metadata
  const og: OpenGraph = {
    ...previousOg,
    title,
    description: description,
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

  // Initialize Twitter metadata
  const twitter: TwitterMetadata = {
    ...previousTwitter,
    title,
    description: baseDescription, // Default description for Twitter
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
    response.creation?.mediaAttributes?.type === MediaType.Video &&
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

    // Modify OpenGraph metadata for video
    og.description = '' // Omit description for Discord compatibility
    og.type = 'video.other' // Specify the OG type as video
    og.videos = [video]

    // Modify Twitter metadata for video
    twitter.card = 'player' // Use 'player' card for video
    twitter.player = videoUrl
    twitter.playerWidth = response.creation.mediaAttributes?.width || 1024
    twitter.playerHeight = response.creation.mediaAttributes?.height || 1024
    // Description is already set to baseDescription for Twitter
  } else {
    // For images or other media types, use 'summary_large_image' card
    twitter.card = 'summary_large_image'
  }

  // Assemble the final metadata object
  const metadata: Metadata = {
    title,
    description: og.description, // OG description (might be empty for videos)
    openGraph: og,
    twitter: twitter,
  }

  return metadata
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
