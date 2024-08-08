import CreationDetail from '@/features/detail/creation-detail'
import { fetcher } from '@/lib/fetcher'
import { CreationsV2GetResponse } from '@edenlabs/eden-sdk'
import { cache } from 'react'

type Props = {
  params: { id: string }
}

//@todo: add metaData

const getCreation = async (id: string) => {
  const response = await fetcher<CreationsV2GetResponse>(
    `${process.env.NEXT_PUBLIC_HOST}/api/creations/${id}`,
  )

  return response
}

const getCreationCached = cache(getCreation)

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
