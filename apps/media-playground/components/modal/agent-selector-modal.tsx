'use client'

import ToggleButton from '@/components/button/toggle-button'
import AgentCardCompact from '@/components/card/agent-card-compact'
import FeedSearchForm from '@/components/filter/feed-search-form'
import { Button } from '@/components/ui/button'
import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ToggleGroup } from '@/components/ui/toggle-group'
import AgentsFeed from '@/features/feed/agents-feed'
import { MAX_AGENTS } from '@/features/sessions/session-config'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { RowItem } from '@/lib/query/cache-updates'
import {
  sortAllAgentsByPreference,
  sortMyAgentsByPreference,
} from '@/lib/sort-agents-by-preference'
import { cn } from '@/lib/utils'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { CheckIcon, Plus } from 'lucide-react'
import Link from 'next/link'
import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react'

type Props = {
  title?: ReactNode
  description?: ReactNode
  className?: string
  trigger?: ReactNode
  selectedAgents?: Agent[]
  onChange: (agents: Agent[]) => void
  query?: FeedAgentCursorArguments
} & PropsWithChildren

const AgentSelectorModal = ({
  title,
  description,
  className,
  trigger,
  selectedAgents = [],
  onChange,
  query: queryProp,
}: Props) => {
  const { user } = useAuthState()

  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<'user' | 'public'>('user')
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedAgents, setTempSelectedAgents] =
    useState<Agent[]>(selectedAgents)

  // Get user preferences for agent sorting
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!user })

  const handleAgentToggle = useCallback((agent: Agent) => {
    setTempSelectedAgents(prev => {
      const existingIndex = prev.findIndex(a => a._id === agent._id)
      if (existingIndex !== -1) {
        // Remove agent if already selected
        return prev.filter(a => a._id !== agent._id)
      } else {
        // Check if we're at the maximum limit
        if (prev.length >= MAX_AGENTS) {
          return prev // Don't add if at limit
        }
        // Add agent if not selected and under limit
        return [...prev, agent]
      }
    })
  }, [])

  const handleConfirm = () => {
    onChange(tempSelectedAgents)
    setOpen(false)
  }

  const scrollRef = useRef<HTMLDivElement>(null)

  const onOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      setSearchQuery('')
      setTempSelectedAgents(selectedAgents)
    }
  }

  // When searching, search across ALL agents (user's own + others' public) - truly universal
  // When not searching:
  //   - My Agents: show agents owned by current user
  //   - Public Agents: show public agents by OTHER users (exclude current user)
  const baseQuery = queryProp || {}
  const currentQuery = {
    ...baseQuery,
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
        // For "Public Agents", presort by last_agents (all agents)
        return sortAllAgentsByPreference(agents, lastAgents) as RowItem[]
      }
    },
    [currentTab, lastAgents, user?._id, searchQuery],
  )

  // Get selected agent IDs for feed component
  const selectedAgentIds = tempSelectedAgents.map(agent => agent._id)
  const isAtLimit = tempSelectedAgents.length >= MAX_AGENTS

  const renderCompactCard = useCallback(
    (agent: Agent) => (
      <AgentCardCompact
        key={agent._id}
        agent={agent}
        onClick={handleAgentToggle}
        isSelected={selectedAgentIds.includes(agent._id)}
      />
    ),
    [handleAgentToggle, selectedAgentIds],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" className="mt-2">
            Select agents{' '}
            {selectedAgents.length > 0 && `(${selectedAgents.length})`}
          </Button>
        )}
      </DialogTrigger>
      <DialogContentScrollable
        ref={scrollRef}
        className={cn([
          `w-[90vw] max-w-[90vw] h-[85vh] overflow-x-hidden flex flex-col`,
          className,
        ])}
      >
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="py-2">{title || 'Select Agents'}</DialogTitle>
          <DialogDescription>
            {description}
            {isAtLimit && (
              <div className="text-amber-600 dark:text-amber-400 mt-1">
                Maximum of {MAX_AGENTS} agents reached. Deselect an agent to
                choose a different one.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ToggleGroup
                type="single"
                value={currentTab}
                className="w-full border border-muted rounded-lg p-1 flex items-center sm:max-w-fit bg-popover"
              >
                <ToggleButton
                  className="w-full sm:w-32 h-8"
                  value={'user'}
                  label={'My Agents'}
                  onClick={() => setCurrentTab('user')}
                />
                <ToggleButton
                  className="w-full sm:w-32 h-8"
                  value={'public'}
                  label={'All Agents'}
                  onClick={() => setCurrentTab('public')}
                />
              </ToggleGroup>
              <FeedSearchForm handleSearch={setSearchQuery} />
            </div>
            <Button asChild size="sm" className="gap-2 shrink-0">
              <Link href="/new/agent">
                <Plus className="h-4 w-4" />
                Create Agent
              </Link>
            </Button>
          </div>

          <div className="h-full overflow-auto pb-4 sleek-scrollbar">
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
          </div>
        </div>

        {/* Sticky Footer - always visible at bottom */}
        <div className="border-t bg-background p-4 flex items-center justify-end gap-4 mt-auto">
          <div className="text-base font-medium text-muted-foreground">
            {tempSelectedAgents.length}/{MAX_AGENTS}{' '}
            {tempSelectedAgents.length === 1 ? 'agent' : 'agents'} selected
          </div>
          <Button
            onClick={handleConfirm}
            size="sm"
            disabled={tempSelectedAgents.length === 0}
          >
            <CheckIcon className="w-4 h-4 mr-1" />
            Confirm Selection
          </Button>
        </div>
      </DialogContentScrollable>
    </Dialog>
  )
}

export default AgentSelectorModal
