import { ArtifactV3, ArtifactsV3GetResponse } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import axios, { AxiosResponse } from 'axios'

export function useArtifactV3Query({
  artifactId,
  enabled = true,
}: {
  artifactId?: string | null
  enabled?: boolean
}) {
  const query = useQuery({
    queryKey: ['artifacts-v3', 'get', artifactId],
    queryFn: async () => {
      const response: AxiosResponse<ArtifactsV3GetResponse> = await axios.get(
        `/api/artifacts-v3/${artifactId}`,
      )
      return response.data
    },
    enabled: enabled && !!artifactId,
    staleTime: 2000,
  })

  return {
    ...query,
    artifact: (query.data?.artifact as ArtifactV3 | undefined) ?? undefined,
  }
}
