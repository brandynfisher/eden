import ModelDetail from '@/features/detail/model-detail'
import customImageLoader, { Formats } from '@/image-loader'
import { fetcher } from '@/lib/fetcher'
import { ModelsV2GetResponse } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

const getModel = async (id: string) => {
  try {
    const response = await fetcher<ModelsV2GetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/models/${id}`,
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

const getModelCached = cache(getModel)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const id = params.id

  // fetch data
  const response = await getModelCached(id || '')

  if (!response) {
    return {}
  }

  // optionally access and extend (rather than replace) parent metadata
  const previousOg: OpenGraph | {} = (await parent).openGraph || {}

  const { model } = response

  const title = `Model by ${model?.user.username} | Eden`
  const description = ``
  const media: { images?: string[]; videos?: string[] } = {}
  media.images = model?.thumbnail
    ? [
        customImageLoader({
          src: model?.thumbnail || '',
          width: 1024,
          format: Formats.JPG,
        }),
      ]
    : undefined
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

const ModelDetailPage = async ({ params: { id: modelId } }: Props) => {
  if (!modelId) {
    return notFound()
  }

  const response = await getModelCached(modelId || '')

  if (!response || !response.model) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return <ModelDetail id={modelId} modelSSRData={response.model} />
}

export default ModelDetailPage
