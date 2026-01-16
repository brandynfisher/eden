import { ArtifactV3, ArtifactsV3ListResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'

export function useArtifactsV3ListQuery({
  sessionId,
  ownerId,
  type,
  enabled = true,
}: {
  sessionId?: string
  ownerId?: string
  type?: string
  enabled?: boolean
}) {
  const query = useQuery({
    queryKey: ['artifacts-v3', 'list', { sessionId, ownerId, type }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (sessionId) params.set('sessionId', sessionId)
      if (ownerId) params.set('ownerId', ownerId)
      if (type) params.set('type', type)
      const response: AxiosResponse<ArtifactsV3ListResponse> = await axios.get(
        `/api/artifacts-v3?${params.toString()}`,
      )
      return response.data
    },
    enabled: enabled && (!!sessionId || !!ownerId || !!type),
    staleTime: 2000,
  })

  return {
    ...query,
    artifacts: query.data?.docs ?? ([] as ArtifactV3[]),
  }
}
