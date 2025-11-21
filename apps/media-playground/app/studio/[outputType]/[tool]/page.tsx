import Workspace from '@/features/tools/workspace'
import { fetcher } from '@/lib/fetcher'
import { ToolV2, ToolsGetResponseV2 } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: {
    tool: ToolV2['key']
    output_type: ToolV2['output_type']
  }
}

const getTool = async (id: string) => {
  try {
    const response = await fetcher<ToolsGetResponseV2>(
      `${process.env.NEXT_PUBLIC_HOST}/api/tools/${id}`,
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

const getToolCached = cache(getTool)

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { tool } = params

  // fetch data
  const response = await getToolCached(tool || '')

  if (!response) {
    return {}
  }

  // optionally access and extend (rather than replace) parent metadata
  const previousOg: OpenGraph | {} = (await parent).openGraph || {}

  const title = `${response.tool?.key} | Eden`
  const description = response.tool?.description
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

const ToolPage = async ({ params }: Props) => {
  const { tool } = params

  if (!tool) {
    return notFound()
  }

  const response = await getToolCached(tool || '')

  if (!response || !response.tool) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return <Workspace toolKey={tool} toolSSRData={response?.tool} />
}

export default ToolPage
