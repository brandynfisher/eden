import { env } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import { ArtifactV3 } from '@edenlabs/eden-sdk'
import {
  PaginatedArtifactsResponse,
  createEdenClient,
} from '@edenlabs/eden-sdk-v3'
import { useQuery } from '@tanstack/react-query'

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
  const { getToken } = useAuth()

  const query = useQuery({
    queryKey: ['artifacts-v3', 'list', { sessionId, ownerId, type }],
    queryFn: async () => {
      const token = await getToken()
      const eden = createEdenClient({
        baseUrl: env.NEXT_PUBLIC_EDEN_API_URL,
        token: token || undefined,
      })

      return eden.artifacts.list({
        sessionId,
        ownerId,
        type,
      }) as Promise<PaginatedArtifactsResponse>
    },
    enabled: enabled && (!!sessionId || !!ownerId || !!type),
    staleTime: 2000,
  })

  return {
    ...query,
    artifacts: (query.data?.docs ?? []) as ArtifactV3[],
  }
}
