'use client'

import { EdenClient } from '@edenlabs/eden-sdk'
import { SessionV2 } from '@edenlabs/eden-sdk'
import { Message } from '@edenlabs/eden-sdk'
import { Creator } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'

interface SharedSessionData {
  share: {
    share_id: string
    title?: string
    session: SessionV2
    messages: Message[]
    owner: Creator
    createdAt: Date
  }
}

interface UseSharedSessionQueryOptions {
  shareId: string
  enabled?: boolean
}

export const useSharedSessionQuery = ({
  shareId,
  enabled = true,
}: UseSharedSessionQueryOptions) => {
  return useQuery({
    queryKey: ['sharedSession', shareId],
    queryFn: async (): Promise<SharedSessionData> => {
      const eden = new EdenClient({
        edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      })

      const response = await eden.sessions.v2.share.get({ share_id: shareId })

      if (!response.share) {
        throw new Error('Share not found')
      }

      return { share: response.share }
    },
    enabled: enabled && !!shareId,
  })
}
