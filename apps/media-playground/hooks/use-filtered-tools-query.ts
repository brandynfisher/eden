'use client'

import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useIsClient } from '@/hooks/use-is-client'
import { FeatureFlag, ToolOutputTypeV2, ToolV2 } from '@edenlabs/eden-sdk'
import { useMemo } from 'react'

type UseFilteredToolsQueryParams = {
  output_type?: ToolOutputTypeV2[]
}

const toolAccessFilter = (
  tools: ToolV2[],
  featureFlags: FeatureFlag[] | undefined,
) => {
  return tools.filter(tool => {
    if (
      tool.key === 'veo3' &&
      !featureFlags?.includes(FeatureFlag.ToolAccessVeo3)
    ) {
      return false
    }
    // Add more feature flag filters here as needed
    return true
  })
}

export const useFilteredToolsQuery = ({
  output_type = ['image', 'video', 'audio', 'lora'],
}: UseFilteredToolsQueryParams = {}) => {
  const { user } = useAuthState()
  const isClient = useIsClient()
  const { tools: rawTools, ...query } = useToolsListQuery({ output_type })

  const filteredTools = useMemo(() => {
    if (!rawTools) return undefined

    // On server/initial render, return all tools to avoid hydration mismatch
    if (!isClient) return rawTools

    // On client, filter by feature flags
    return toolAccessFilter(rawTools, user?.featureFlags)
  }, [rawTools, isClient, user?.featureFlags])

  return {
    tools: filteredTools,
    ...query,
  }
}
