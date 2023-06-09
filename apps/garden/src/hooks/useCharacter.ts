import { fetcher } from '@/lib/fetcher'
import { Agent } from '@eden-labs/eden-sdk/dist/responses/AgentsGetResponse'
import useSWR from 'swr'

export const useCharacter = (characterId: string | string[] | undefined) => {
  const id = typeof characterId === 'string' ? characterId : undefined
  const { data, mutate } = useSWR(
    id ? `/api/agents?agentId=${id}` : null,
    fetcher,
  )

  return {
    character: data?.character as Agent,
    mutate,
  }
}
