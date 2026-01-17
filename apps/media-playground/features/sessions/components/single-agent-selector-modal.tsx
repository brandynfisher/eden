'use client'

import ToggleButton from '@/components/button/toggle-button'
import AgentCardCompact from '@/components/card/agent-card-compact'
import FeedSearchForm from '@/components/filter/feed-search-form'
import LoadingIndicator from '@/components/loading-indicator'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ToggleGroup } from '@/components/ui/toggle-group'
import AgentsFeed from '@/features/feed/agents-feed'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import {
  sortAllAgentsByPreference,
  sortMyAgentsByPreference,
} from '@/lib/sort-agents-by-preference'
import { Agent } from '@edenlabs/eden-sdk'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'

type TabType = 'user' | 'public'

const SingleAgentSelectorModal: FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (agent: Agent) => void
  allowedAgentIds?: string[]
  emptyStateText?: string
  /** Which tabs to show. Defaults to both ['user', 'public']. If only one tab, the toggle is hidden. */
  allowedTabs?: TabType[]
  /** Description text shown below the title. Defaults to "Choose an agent to chat with" */
  description?: string
}> = ({
  open,
  onOpenChange,
  onSelect,
  allowedAgentIds,
  emptyStateText,
  allowedTabs = ['user', 'public'],
  description = 'Choose an agent to chat with',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTab, setCurrentTab] = useState<TabType>(allowedTabs[0])
  const [isNavigating, setIsNavigating] = useState(false)
  const { user } = useAuthState()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Get user preferences for agent sorting
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!user })

  const normalizedAllowedAgentIds = React.useMemo(() => {
    if (!allowedAgentIds) return null
    return Array.from(
      new Set(allowedAgentIds.filter((id): id is string => Boolean(id))),
    )
  }, [allowedAgentIds])

  const shouldFilterByAllowedAgents =
    normalizedAllowedAgentIds !== null && normalizedAllowedAgentIds.length > 0

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      // Reset to first allowed tab when opening
      setCurrentTab(allowedTabs[0])
    } else {
      setIsNavigating(false)
      setSearchQuery('')
    }
  }, [open, allowedTabs])

  // When searching, search across ALL agents (user's own + others' public) - truly universal
  // When not searching:
  //   - My Agents: show agents owned by current user
  //   - All Agents: show public agents by OTHER users (exclude current user)
  const currentQuery = {
    limit: 35,
    ...(searchQuery
      ? {
          // Universal search - no tab filtering, search everything
          search: searchQuery,
        }
      : {
          // No search - apply tab-specific filters
          ...(currentTab === 'user' && user?._id ? { user: user._id } : {}),
          ...(currentTab === 'public' && user?._id
            ? { excludeOwner: user._id }
            : {}),
        }),
    ...(shouldFilterByAllowedAgents ? { _id: normalizedAllowedAgentIds } : {}),
    // Sort by total number of messages
    sort: ['stats.messageCount;-1'],
  }

  // Custom sort function based on current tab
  // When searching, use universal sort (no filtering) since search results span all agents
  const customSort = useCallback(
    (items: RowItem[]): RowItem[] => {
      // Cast items to agents for sorting
      const agents = items as Agent[]

      // When searching, don't filter - just sort by preference across all results
      if (searchQuery) {
        return sortAllAgentsByPreference(agents, lastAgents) as RowItem[]
      }

      if (currentTab === 'user') {
        // For "My Agents", presort by last_agents (top 5, owned by user only)
        return sortMyAgentsByPreference(
          agents,
          lastAgents,
          user?._id,
        ) as RowItem[]
      } else {
        // For "All Agents", presort by last_agents (all agents)
        return sortAllAgentsByPreference(agents, lastAgents) as RowItem[]
      }
    },
    [currentTab, lastAgents, user?._id, searchQuery],
  )

  const handleAgentClick = useCallback(
    (agent: Agent) => {
      setIsNavigating(true)
      onSelect(agent)
      // Don't close modal immediately - let parent handle closing after navigation
    },
    [onSelect],
  )

  const renderCompactCard = useCallback(
    (agent: Agent) => (
      <AgentCardCompact
        key={agent._id}
        agent={agent}
        onClick={isNavigating ? undefined : handleAgentClick}
      />
    ),
    [isNavigating, handleAgentClick],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle>Select Agent</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {allowedTabs.length > 1 && (
                <ToggleGroup
                  type="single"
                  value={currentTab}
                  className="w-full border border-muted rounded-lg p-1 flex items-center sm:max-w-fit bg-popover"
                >
                  {allowedTabs.includes('user') && (
                    <ToggleButton
                      className="w-full sm:w-32 h-8"
                      value={'user'}
                      label={'My Agents'}
                      onClick={() => setCurrentTab('user')}
                    />
                  )}
                  {allowedTabs.includes('public') && (
                    <ToggleButton
                      className="w-full sm:w-32 h-8"
                      value={'public'}
                      label={'All Agents'}
                      onClick={() => setCurrentTab('public')}
                    />
                  )}
                </ToggleGroup>
              )}
              <FeedSearchForm handleSearch={setSearchQuery} />
            </div>
            <Button asChild size="sm" className="gap-2 shrink-0">
              <Link href="/new/agent">
                <Plus className="h-4 w-4" />
                Create Agent
              </Link>
            </Button>
          </div>
          <div
            className="flex-1 overflow-auto [&_a]:pointer-events-none relative min-h-[400px] sleek-scrollbar"
            ref={scrollRef}
          >
            {isNavigating && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <LoadingIndicator className="w-8 h-8" />
                  <span className="text-sm text-muted-foreground">
                    Loading agent...
                  </span>
                </div>
              </div>
            )}
            {normalizedAllowedAgentIds?.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {emptyStateText ?? 'No agents available.'}
              </div>
            ) : (
              <AgentsFeed
                query={currentQuery}
                minCols={1}
                maxCols={5}
                breakpoints={[
                  { minWidth: 1536, columns: 5 }, // Very wide screens - 5 columns max
                  { minWidth: 1280, columns: 4 }, // Wide screens - 4 columns
                  { minWidth: 1024, columns: 3 }, // Large desktop - 3 columns
                  { minWidth: 768, columns: 2 }, // Tablet - 2 columns
                  { minWidth: 640, columns: 2 }, // Large mobile - 2 columns
                  { minWidth: 0, columns: 1 }, // Small mobile - 1 column
                ]}
                scrollRef={scrollRef}
                hideCreateButton={true}
                hideContextMenu={true}
                customSort={customSort}
                renderCard={renderCompactCard}
                itemHeight={136}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SingleAgentSelectorModal
