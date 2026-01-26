import { env } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import { ArtifactV3 } from '@edenlabs/eden-sdk'
import { ArtifactResponse, createEdenClient } from '@edenlabs/eden-sdk-v3'
import { useQuery } from '@tanstack/react-query'

export function useArtifactV3Query({
  artifactId,
  enabled = true,
}: {
  artifactId?: string | null
  enabled?: boolean
}) {
  const { getToken } = useAuth()

  const query = useQuery({
    queryKey: ['artifacts-v3', 'get', artifactId],
    queryFn: async () => {
      const token = await getToken()
      const eden = createEdenClient({
        baseUrl: env.NEXT_PUBLIC_EDEN_API_URL,
        token: token || undefined,
      })

      if (!artifactId) {
        throw new Error('Artifact ID is required')
      }

      return eden.artifacts.get(artifactId) as Promise<ArtifactResponse>
    },
    enabled: enabled && !!artifactId,
    staleTime: 2000,
  })

  return {
    ...query,
    artifact: (query.data?.artifact as ArtifactV3 | undefined) ?? undefined,
  }
}
