import ArtifactDetail from '@/features/detail/artifact-detail'
import { fetcher } from '@/lib/fetcher'
import { ArtifactsV2GetResponse } from '@edenlabs/eden-sdk'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

const getArtifact = async (
  id: string,
): Promise<ArtifactsV2GetResponse | undefined> => {
  try {
    const response = await fetcher<ArtifactsV2GetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/artifacts/${id}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    )

    return response
  } catch (e) {
    console.error('Error fetching artifact:', e)
    return undefined
  }
}

const getArtifactCached = cache(getArtifact)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id
  const response = await getArtifactCached(id || '')

  if (!response) {
    return {}
  }

  const title = `Artifact: ${response.artifact?.title} by ${response.artifact?.user?.username} | Eden`
  const description =
    response.artifact?.description ||
    `Check out this artifact by ${response.artifact?.user?.username}!`

  return {
    title,
    description,
  }
}

const ArtifactDetailPage = async ({ params: { id: artifactId } }: Props) => {
  if (!artifactId) {
    return notFound()
  }

  const response = await getArtifactCached(artifactId || '')

  if (!response || !response.artifact) {
    return notFound()
  }

  if (response.error) {
    return <div>error response: {String(response.error)}</div>
  }

  return <ArtifactDetail id={artifactId} artifactSSRData={response.artifact} />
}

export default ArtifactDetailPage
