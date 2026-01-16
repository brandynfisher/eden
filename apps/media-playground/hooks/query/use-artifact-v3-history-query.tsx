import { ArtifactEditV3, ArtifactsV3HistoryResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'

export function useArtifactV3HistoryQuery({
  artifactId,
  enabled = true,
  page = 1,
  limit = 20,
}: {
  artifactId?: string | null
  enabled?: boolean
  page?: number
  limit?: number
}) {
  const query = useQuery({
    queryKey: ['artifacts-v3', 'history', artifactId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      const response: AxiosResponse<ArtifactsV3HistoryResponse> =
        await axios.get(
          `/api/artifacts-v3/${artifactId}/history?${params.toString()}`,
        )
      return response.data
    },
    enabled: enabled && !!artifactId,
    staleTime: 2000,
  })

  return {
    ...query,
    history: query.data?.docs ?? ([] as ArtifactEditV3[]),
  }
}
