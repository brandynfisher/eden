import CollectionDetail from '@/features/detail/collection-detail'
import customImageLoader, { Formats } from '@/image-loader'
import { fetcher } from '@/lib/fetcher'
import { getCloudfrontUrl } from '@/lib/media'
import { OpenGraph, OpenGraphVideo, TwitterMetadata } from '@/types/OpenGraph'
import { CollectionsV2GetResponse, MediaType } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: { id: string }
}
// const CollectionDetails = () => {
//   const { user } = useAuthState()
//   const { id } = useParams()
//   const router = useRouter()
//
//   const { collection, isLoading, invalidate } = useCollectionQuery({
//     key: id as string,
//   })
//
//   if (isLoading) {
//     return <LoadingIndicator className="mx-auto mt-10" />
//   }
//
//   if (!collection) {
//     return <div className="mx-auto mt-10">Collection not found</div>
//   }
//
//   return (
//     <CollectionDetail id={id} collectionSSRData={collection}/>
//   )
// }

const getCollection = async (
  id: string,
): Promise<CollectionsV2GetResponse | undefined> => {
  try {
    const response = await fetcher<CollectionsV2GetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/collections/${id}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    )

    return response
  } catch (e) {
    console.error('Error fetching collection:', e)
    return undefined
  }
}

const getCollectionCached = cache(getCollection)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = params.id
  const response = await getCollectionCached(id || '')

  if (!response) {
    return {}
  }

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const title = `Collection: ${response.collection?.name} by ${response.collection?.user.username} | Eden Create`
  const baseDescription = `Check out this collection by ${response.collection?.user.username}!`
  const description = response.collection?.description

  // Initialize OpenGraph metadata
  const og: OpenGraph = {
    ...previousOg,
    title,
    description: description,
    images: response.collection?.coverCreation?.thumbnail
      ? [
          customImageLoader({
            src: response.collection?.coverCreation?.thumbnail || '',
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
    images: response.collection?.coverCreation.thumbnail
      ? [
          customImageLoader({
            src: response.collection?.coverCreation.thumbnail || '',
            width: 1024,
            format: Formats.JPG,
          }),
        ]
      : undefined,
  }

  if (
    response.collection?.coverCreation.mediaAttributes?.type ===
      MediaType.Video &&
    response.collection.coverCreation.url
  ) {
    const videoUrl = getCloudfrontUrl(response.collection.coverCreation.url)

    const video: OpenGraphVideo = {
      url: videoUrl,
      secureUrl: videoUrl,
      type:
        response.collection.coverCreation.mediaAttributes?.mimeType ||
        'video/mp4',
      width: response.collection.coverCreation.mediaAttributes?.width || 1024,
      height: response.collection.coverCreation.mediaAttributes?.height || 1024,
    }

    // Modify OpenGraph metadata for video
    og.description = '' // Omit description for Discord compatibility
    og.type = 'video.other' // Specify the OG type as video
    og.videos = [video]

    // Modify Twitter metadata for video
    twitter.card = 'player' // Use 'player' card for video
    twitter.player = videoUrl
    twitter.playerWidth =
      response.collection?.coverCreation?.mediaAttributes?.width || 1024
    twitter.playerHeight =
      response.collection?.coverCreation?.mediaAttributes?.height || 1024
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

const CollectionDetailPage = async ({
  params: { id: collectionId },
}: Props) => {
  if (!collectionId) {
    return notFound()
  }

  const response = await getCollectionCached(collectionId || '')

  if (!response || !response.collection) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return (
    <CollectionDetail
      id={collectionId}
      collectionSSRData={response.collection}
    />
  )
}

export default CollectionDetailPage
