import { env } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import {
  ArtifactHistoryEntry,
  PaginatedArtifactsHistoryResponse,
  createEdenClient,
} from '@edenlabs/eden-sdk-v3'
import { useQuery } from '@tanstack/react-query'

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
  const { getToken } = useAuth()

  const query = useQuery({
    queryKey: ['artifacts-v3', 'history', artifactId, page, limit],
    queryFn: async () => {
      const token = await getToken()
      const eden = createEdenClient({
        baseUrl: env.NEXT_PUBLIC_EDEN_API_URL,
        token: token || undefined,
      })

      if (!artifactId) {
        throw new Error('Artifact ID is required')
      }

      return eden.artifacts.history(artifactId, {
        page,
        limit,
      }) as Promise<PaginatedArtifactsHistoryResponse>
    },
    enabled: enabled && !!artifactId,
    staleTime: 2000,
  })

  return {
    ...query,
    history: (query.data?.docs ?? []) as ArtifactHistoryEntry[],
  }
}
