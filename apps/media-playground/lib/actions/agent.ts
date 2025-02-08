'use server'

import { fetcher } from '@/lib/fetcher'
import { AgentGetResponse, AgentSuggestion } from '@edenlabs/eden-sdk'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getAgent = async (
  id: string,
): Promise<AgentGetResponse | undefined> => {
  try {
    const response = await fetcher<AgentGetResponse>(
      `${process.env.NEXT_PUBLIC_HOST}/api/agents/${id}`,
      {
        credentials: 'include',
        headers: { Cookie: cookies().toString() },
      },
    )

    return response
  } catch (e) {
    console.error('Error fetching agent:', e)
    return undefined
  }
}

export const getAgentCached = cache(getAgent)

export interface AgentBasicInfo {
  _id: string
  name: string
  username: string
  userImage?: string
  description: string
  persona?: string
  greeting?: string
  knowledge?: string
  suggestions?: AgentSuggestion[]
}

export const getMultipleAgents = async (
  ids: string[],
): Promise<Record<string, AgentBasicInfo>> => {
  try {
    const agentPromises = ids.map(id => getAgentCached(id))
    const agents = await Promise.all(agentPromises)

    return agents.reduce(
      (
        acc: Record<string, AgentBasicInfo>,
        response: AgentGetResponse | undefined,
        index: number,
      ) => {
        if (response?.agent) {
          const {
            _id,
            name,
            username,
            userImage,
            description,
            persona,
            greeting,
            knowledge,
            suggestions,
          } = response.agent

          acc[ids[index]] = {
            _id,
            name,
            username,
            userImage,
            description,
            persona,
            greeting,
            knowledge,
            suggestions,
          }
        }
        return acc
      },
      {} as Record<string, AgentBasicInfo>,
    )
  } catch (e) {
    console.error('Error fetching multiple agents:', e)
    return {}
  }
}

// Cache for 5 minutes
export const getMultipleAgentsCached = cache(getMultipleAgents)
