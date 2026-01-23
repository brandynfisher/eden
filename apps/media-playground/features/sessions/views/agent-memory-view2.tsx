'use client'

import CollectiveMemory2 from './collective-memory2'
import UserMemory2 from './user-memory2'
import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { Agent } from '@edenlabs/eden-sdk'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

// Types for memory data
interface Reflection {
  _id: string
  content: string
  formed_at: string
}

interface Fact {
  _id: string
  content: string
  formed_at: string
  scope: string
  access_count: number
}

interface MemoryData {
  consolidatedContent: string
  reflections: Reflection[]
  facts: Fact[]
}

interface AgentMemoryView2Props {
  agent: Agent
  /** The query key used to fetch this agent - needed for proper cache updates */
  agentQueryKey?: string
  variant?: 'standalone' | 'panel'
}

const AgentMemoryView2: FC<AgentMemoryView2Props> = ({
  agent,
  agentQueryKey,
  variant = 'standalone',
}) => {
  const queryClient = useQueryClient()
  const { user: authUser } = useAuthState()
  const { hasEditAccess } = useAgentPermissions(agent, authUser?._id)
  const userMemoryGate = useGatedResource(GatedResource.UserMemory, {
    lockedBehavior: 'modal',
  })
  const collectiveMemoryGate = useGatedResource(
    GatedResource.CollectiveMemory,
    {
      lockedBehavior: 'modal',
    },
  )
  const [memoryTab, setMemoryTab] = useState<'user' | 'collective'>('user')

  // The key used for React Query cache - use provided key or fall back to agent._id
  const cacheKey = agentQueryKey || String(agent._id)

  // Lift toggle states to parent so they persist across tab switches
  // Initialize from agent prop (source of truth from React Query cache)
  const [userMemoryEnabled, setUserMemoryEnabled] = useState(
    agent.user_memory_enabled ?? true,
  )
  const [agentMemoryEnabled, setAgentMemoryEnabled] = useState(
    agent.agent_memory_enabled ?? false,
  )
  const [isTogglingUserMemory, setIsTogglingUserMemory] = useState(false)
  const [isTogglingAgentMemory, setIsTogglingAgentMemory] = useState(false)

  // Lift data state to parent to cache across tab switches
  // User memory data
  const [userMemoryData, setUserMemoryData] = useState<MemoryData>({
    consolidatedContent: '',
    reflections: [],
    facts: [],
  })
  const [isUserMemoryLoading, setIsUserMemoryLoading] = useState(true)
  const [hasUserMemoryLoaded, setHasUserMemoryLoaded] = useState(false)

  // Collective memory data
  const [collectiveMemoryData, setCollectiveMemoryData] = useState<MemoryData>({
    consolidatedContent: '',
    reflections: [],
    facts: [],
  })
  const [isCollectiveMemoryLoading, setIsCollectiveMemoryLoading] =
    useState(true)
  const [hasCollectiveMemoryLoaded, setHasCollectiveMemoryLoaded] =
    useState(false)

  // Sync local state when agent prop changes (e.g., modal reopened with fresh data)
  // This ensures the UI reflects the database state when the component remounts
  useEffect(() => {
    setUserMemoryEnabled(agent.user_memory_enabled ?? true)
    setAgentMemoryEnabled(agent.agent_memory_enabled ?? false)
  }, [agent.user_memory_enabled, agent.agent_memory_enabled])

  // Fetch user memory data
  const fetchUserMemoryData = useCallback(async () => {
    setIsUserMemoryLoading(true)
    try {
      const response = await axios.get(`/api/agents/${agent._id}/memory2`)
      setUserMemoryData({
        consolidatedContent: response.data.consolidated_content || '',
        reflections: response.data.unabsorbed_reflections || [],
        facts: response.data.facts || [],
      })
      setHasUserMemoryLoaded(true)
    } catch (error) {
      console.error('Error loading user memory2 data:', error)
      setUserMemoryData({
        consolidatedContent: '',
        reflections: [],
        facts: [],
      })
    } finally {
      setIsUserMemoryLoading(false)
    }
  }, [agent._id])

  // Fetch collective memory data
  const fetchCollectiveMemoryData = useCallback(async () => {
    setIsCollectiveMemoryLoading(true)
    try {
      const response = await axios.get(`/api/agents/${agent._id}/memory2-agent`)
      setCollectiveMemoryData({
        consolidatedContent: response.data.consolidated_content || '',
        reflections: response.data.unabsorbed_reflections || [],
        facts: response.data.facts || [],
      })
      setHasCollectiveMemoryLoaded(true)
    } catch (error) {
      console.error('Error loading collective memory2 data:', error)
      setCollectiveMemoryData({
        consolidatedContent: '',
        reflections: [],
        facts: [],
      })
    } finally {
      setIsCollectiveMemoryLoading(false)
    }
  }, [agent._id])

  // Initial fetch for user memory if enabled and not yet loaded
  useEffect(() => {
    if (userMemoryEnabled && !hasUserMemoryLoaded) {
      fetchUserMemoryData()
    } else if (!userMemoryEnabled) {
      setIsUserMemoryLoading(false)
    }
  }, [userMemoryEnabled, hasUserMemoryLoaded, fetchUserMemoryData])

  // Initial fetch for collective memory if enabled and not yet loaded
  useEffect(() => {
    if (agentMemoryEnabled && !hasCollectiveMemoryLoaded) {
      fetchCollectiveMemoryData()
    } else if (!agentMemoryEnabled) {
      setIsCollectiveMemoryLoading(false)
    }
  }, [agentMemoryEnabled, hasCollectiveMemoryLoaded, fetchCollectiveMemoryData])

  // Handler for toggling user memory - manages state at parent level
  const handleToggleUserMemory = async (enabled: boolean) => {
    // Store previous value for rollback
    const previousValue = userMemoryEnabled

    // Optimistic update - update local state immediately
    setUserMemoryEnabled(enabled)
    setIsTogglingUserMemory(true)

    try {
      await axios.patch(`/api/agents/${agent._id}/user-memory-enabled`, {
        user_memory_enabled: enabled,
      })

      // Update the React Query cache so other components see the change
      // Use the provided cache key to ensure we update the correct cache entry
      queryClient.setQueryData(
        ['agents', cacheKey],
        (oldData: { agent: Agent } | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            agent: { ...oldData.agent, user_memory_enabled: enabled },
          }
        },
      )

      // If turning on, fetch the data immediately
      if (enabled && !hasUserMemoryLoaded) {
        fetchUserMemoryData()
      }

      toast.success(enabled ? 'User memory enabled' : 'User memory disabled')
    } catch (error) {
      // Revert on error
      setUserMemoryEnabled(previousValue)
      console.error('Error toggling user memory:', error)
      toast.error('Failed to update memory setting')
    } finally {
      setIsTogglingUserMemory(false)
    }
  }

  // Handler for toggling agent/collective memory - manages state at parent level
  const handleToggleAgentMemory = async (enabled: boolean) => {
    // Store previous value for rollback
    const previousValue = agentMemoryEnabled

    // Optimistic update - update local state immediately
    setAgentMemoryEnabled(enabled)
    setIsTogglingAgentMemory(true)

    try {
      await axios.patch(`/api/agents/${agent._id}/agent-memory-enabled`, {
        agent_memory_enabled: enabled,
      })

      // Update the React Query cache so other components see the change
      // Use the provided cache key to ensure we update the correct cache entry
      queryClient.setQueryData(
        ['agents', cacheKey],
        (oldData: { agent: Agent } | undefined) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            agent: { ...oldData.agent, agent_memory_enabled: enabled },
          }
        },
      )

      // If turning on, fetch the data immediately
      if (enabled && !hasCollectiveMemoryLoaded) {
        fetchCollectiveMemoryData()
      }

      toast.success(
        enabled ? 'Collective memory enabled' : 'Collective memory disabled',
      )
    } catch (error) {
      // Revert on error
      setAgentMemoryEnabled(previousValue)
      console.error('Error toggling collective memory:', error)
      toast.error('Failed to update memory setting')
    } finally {
      setIsTogglingAgentMemory(false)
    }
  }

  const collectiveMemoryAccess = useMemo(() => {
    if (!hasEditAccess) {
      return { showTab: false, hasAccess: false }
    }

    return {
      showTab: true,
      hasAccess: collectiveMemoryGate.isAllowed,
    }
  }, [collectiveMemoryGate.isAllowed, hasEditAccess])

  const isPanelLayout = variant === 'panel'
  const outerWrapperClass = isPanelLayout
    ? 'space-y-6'
    : 'flex-1 overflow-auto bg-accent p-3 md:p-4'
  const innerWrapperClass = isPanelLayout
    ? 'space-y-6'
    : 'mx-auto max-w-5xl space-y-6'

  return (
    <TooltipProvider>
      <div className={outerWrapperClass}>
        <div className={innerWrapperClass}>
          <div
            className={`space-y-6 ${
              isPanelLayout ? 'rounded-xl border border-border bg-card p-6' : ''
            }`}
          >
            {/* Title */}
            {!isPanelLayout && (
              <div className="text-left w-full">
                <h1 className="text-3xl font-bold text-foreground">
                  Manage {agent.name}'s memories
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Memory System v2
                </p>
              </div>
            )}

            {/* Tab Toggle */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-border rounded-full"></div>
                  {/* Memory Type Toggle - Switch style buttons */}
                  {collectiveMemoryAccess.showTab ? (
                    <div className="relative inline-flex items-center bg-muted rounded-lg p-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setMemoryTab('user')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-help w-32 ${
                              memoryTab === 'user'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            User
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p>
                            This is your personal preferences memory with{' '}
                            {agent.name}, extracted from all your conversations
                            with this agent. These memories only affect your own
                            interactions with {agent.name}.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setMemoryTab('collective')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-help w-32 ${
                              memoryTab === 'collective'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Collective
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p>
                            This is {agent.name}'s collective memory. This
                            memory is formed and evolved by all its
                            conversations with all users.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <h2 className="text-lg font-semibold text-foreground ml-2">
                      User Memory
                    </h2>
                  )}
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {memoryTab === 'user' ? (
            userMemoryGate.isAllowed ? (
              <UserMemory2
                agent={agent}
                hasEditAccess={hasEditAccess}
                isMemoryEnabled={userMemoryEnabled}
                isTogglingMemory={isTogglingUserMemory}
                onToggleMemory={handleToggleUserMemory}
                // Cached data from parent
                memoryData={userMemoryData}
                setMemoryData={setUserMemoryData}
                isLoading={isUserMemoryLoading}
              />
            ) : (
              <LockedFeatureBanner
                gate={userMemoryGate}
                title="User memory is for subscribers"
                description="Store and reuse personal context with Basic and above."
              />
            )
          ) : collectiveMemoryGate.isAllowed ? (
            <CollectiveMemory2
              agent={agent}
              hasEditAccess={collectiveMemoryAccess.hasAccess}
              isMemoryEnabled={agentMemoryEnabled}
              isTogglingMemory={isTogglingAgentMemory}
              onToggleMemory={handleToggleAgentMemory}
              // Cached data from parent
              memoryData={collectiveMemoryData}
              setMemoryData={setCollectiveMemoryData}
              isLoading={isCollectiveMemoryLoading}
            />
          ) : (
            <LockedFeatureBanner
              gate={collectiveMemoryGate}
              title="Collective memory is for subscribers"
              description="Upgrade to Basic or above to unlock collective memory—a shared memory that learns from all conversations, perfect for community managers and team assistants."
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default AgentMemoryView2
