import Workspace from '@/features/generators/workspace'
import { fetcher } from '@/lib/fetcher'
import { GeneratorV2, GeneratorsGetResponseV2 } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: {
    generator: GeneratorV2['key']
    outputType: GeneratorV2['outputType']
  }
}

const getGenerator = async (id: string) => {
  try {
    const response = await fetcher<GeneratorsGetResponseV2>(
      `${process.env.NEXT_PUBLIC_HOST}/api/generators/${id}`,
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

const getGeneratorCached = cache(getGenerator)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { generator } = params

  // fetch data
  const response = await getGeneratorCached(generator || '')

  if (!response) {
    return {}
  }

  // optionally access and extend (rather than replace) parent metadata
  const previousOg: OpenGraph | {} = (await parent).openGraph || {}

  const title = `${response.generator?.key} | Garden of Eden`
  const description = response.generator?.description
  const media: { images?: string[]; videos?: string[] } = {}
  // if (response.generator?.mediaAttributes?.type === MediaType.Video) {
  //   media.videos = response.creation?.url
  //     ? [getCloudfrontUrl(response.creation?.url)]
  //     : undefined
  // } else {
  //   media.images = response.creation?.thumbnail
  //     ? [
  //       customImageLoader({
  //         src: response.creation?.thumbnail || '',
  //         width: 1024,
  //         format: Formats.JPG,
  //       }),
  //     ]
  //     : undefined
  // }

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

const GeneratorPage = async ({ params }: Props) => {
  const { generator } = params

  if (!generator) {
    return notFound()
  }

  const response = await getGeneratorCached(generator || '')

  if (!response || !response.generator) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return (
    <Workspace
      generatorKey={generator}
      generatorSSRData={response?.generator}
    />
  )
}

export default GeneratorPage
