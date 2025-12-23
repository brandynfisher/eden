'use client'

import RecentCreationsFeed from '@/components/feed/recent-creations-feed'
import { useAppShell } from '@/components/layout/app-shell'
import TextClampMore from '@/components/text/text-clamp-more'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { handleShareClick } from '@/features/detail/agent-share-util'
import {
  usePinAgent,
  useUnpinAgent,
} from '@/hooks/mutation/use-agent-preferences'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { formatCompactNumber } from '@/lib/strings'
import { useAppDispatch } from '@/stores/store'
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  EyeIcon,
  EyeOffIcon,
  MenuIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  SettingsIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

type Props = {
  id: string
  agentSSRData?: Agent
  scrollRef?: RefObject<HTMLDivElement>
}

// Define filter types within AgentDetail
type FilterMode = 'all' | 'mine'

const MAX_PINNED_AGENTS = 5

const AgentDetail = ({ id, agentSSRData }: Props) => {
  const { user, isSignedIn, verifyAuth } = useAuthState()
  const { openMobileSidebar } = useAppShell()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Pinning functionality
  const { pinnedAgents } = useUserPreferencesQuery({
    enabled: !!isSignedIn,
  })
  const pinAgent = usePinAgent()
  const unpinAgent = useUnpinAgent()

  // Use standard useState again
  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    // Initialize state from URL search param on mount
    const initialTab = searchParams?.get('tab')
    return initialTab === 'mine' ? 'mine' : 'all' // Default to 'all'
  })

  // State to hold the scroll INDEX target read from history state
  const [initialScrollIndex, setInitialScrollIndex] = useState<number | null>(
    null,
  )

  // Callback to clear state after scroll restore
  const clearScrollIndexState = useCallback(() => {
    setInitialScrollIndex(null)
    // REMOVE URL param clearing logic
  }, []) // No dependencies needed now

  // Effect to read initial scroll INDEX from history state
  useEffect(() => {
    // Read scrollIndex from history state
    const historyScrollIndex = window.history.state?.scrollIndex

    // If the history state exists, attempt to read and set state
    if (typeof historyScrollIndex === 'number') {
      const scrollIndex = historyScrollIndex
      setInitialScrollIndex(scrollIndex)
      setInitialScrollIndex(scrollIndex)
      // Clear the history state immediately after reading
      try {
        const currentState = window.history.state || {}
        // Manually build restState if scrollIndex exists
        if (
          typeof currentState === 'object' &&
          currentState !== null &&
          'scrollIndex' in currentState
        ) {
          const restState: Record<string, unknown> = {}
          for (const key in currentState) {
            if (key !== 'scrollIndex') {
              // Clear scrollIndex
              restState[key] = currentState[key]
            }
          }
          window.history.replaceState(restState, '')
        }
      } catch (e) {
        console.error('Error clearing history state:', e)
      }
    }
    // Depend on searchParams/router to potentially catch navigation events
  }, [searchParams, router, id])

  // Effect to update URL when filterMode changes
  useEffect(() => {
    const currentTab = searchParams?.get('tab')
    const newTabValue = filterMode === 'mine' ? 'mine' : null // null removes the param

    // Avoid pushing the same state
    if (currentTab === newTabValue || (!currentTab && !newTabValue)) {
      return
    }

    // Create new URLSearchParams but preserve other params
    const params = new URLSearchParams(searchParams?.toString())
    if (newTabValue) {
      params.set('tab', newTabValue)
    } else {
      params.delete('tab')
    }

    // Use history.replaceState directly to avoid Next.js routing
    // Ensure we're updating both the URL and the state
    const newSearch = params.toString()
    const newUrl = `${window.location.pathname}${
      newSearch ? '?' + newSearch : ''
    }`

    // Update the URL and trigger a re-render by updating searchParams
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      '',
      newUrl,
    )

    // Force a re-render of components that depend on searchParams
    const event = new PopStateEvent('popstate', { state: window.history.state })
    window.dispatchEvent(event)
  }, [filterMode, searchParams])

  const feedSectionRef = useRef<HTMLDivElement>(null)
  const { agent: agentClientData } = useAgentQuery({
    key: id,
    initialData: agentSSRData
      ? {
          agent: agentSSRData,
        }
      : undefined,
  })

  const agent = agentClientData || agentSSRData
  const {
    hasOwnerAccess,
    hasEditAccess,
    isLoading: isPermissionsLoading,
  } = useAgentPermissions(agent, user?._id)
  const canEditAgentSettings = hasEditAccess && !isPermissionsLoading

  // Check if agent is pinned
  const isPinned = useMemo(() => {
    if (!agent || !pinnedAgents) return false
    return pinnedAgents.some(
      (pinnedAgent: { _id?: string; agentId?: string }) =>
        pinnedAgent._id === agent._id || pinnedAgent.agentId === agent._id,
    )
  }, [agent, pinnedAgents])

  const canPin = !isPinned && (pinnedAgents?.length ?? 0) < MAX_PINNED_AGENTS

  const handlePinAgent = () => {
    if (!agent) return
    pinAgent.mutate(agent._id, {
      onSuccess: () => {
        toast.success('Agent pinned', {
          description: `${agent.name} has been pinned to your sidebar`,
        })
      },
    })
  }

  const handleUnpinAgent = () => {
    if (!agent) return
    unpinAgent.mutate(agent._id, {
      onSuccess: () => {
        toast.success('Agent unpinned', {
          description: `${agent.name} has been unpinned`,
        })
      },
    })
  }

  const handleTogglePublic = async () => {
    if (!agent) return
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        public: !agent.public,
      })
      toast.success(
        agent.public ? 'Agent is now private' : 'Agent is now public',
      )
      window.location.reload()
    } catch {
      toast.error('Failed to update visibility')
    }
  }

  const handleDeleteAgent = async () => {
    if (!agent) return
    const confirmed = window.confirm(
      'Delete this agent? This action cannot be undone.',
    )
    if (!confirmed) return

    try {
      await axios.delete(`/api/agents/${agent._id}`)
      toast.success('Agent deleted', {
        description: `"${agent.name}" has been deleted.`,
      })
      router.push('/agents')
    } catch {
      toast.error('Failed to delete agent')
    }
  }

  // Construct the query for RecentCreationsFeed based on filterMode
  const recentCreationsQuery = useMemo(() => {
    if (!agent) return {}
    const baseAgentQuery = { agent: agent._id }
    if (filterMode === 'mine' && user?._id) {
      return { ...baseAgentQuery, user: user._id }
    }
    return baseAgentQuery
  }, [agent, filterMode, user?._id])

  if (!agent) return null

  // Determine if the filter tabs should be shown
  const showFilterTabs = isSignedIn && !!user
  const messageCount = agent.stats?.messageCount ?? 0

  return (
    <div className="flex flex-col min-h-0">
      {/* Mobile navbar - sticky */}
      <div className="md:hidden sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-2 shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Hero Header Section */}
      <header className="relative px-4 sm:px-6 md:px-10 pt-4 sm:pt-6 pb-6 sm:pb-8">
        <div className="flex gap-4 sm:gap-6">
          {/* Avatar - fixed square size */}
          <Avatar className="h-28 w-28 sm:h-40 sm:w-40 md:h-48 md:w-48 rounded-xl sm:rounded-2xl shrink-0 ring-1 ring-border/50 shadow-lg self-center">
            {agent.userImage ? (
              <AvatarImage
                className="object-cover"
                src={agent.userImage}
                alt={agent.name}
              />
            ) : (
              <AvatarFallback className="rounded-xl sm:rounded-2xl text-2xl sm:text-4xl font-medium bg-muted">
                {agent.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Agent Info */}
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            {/* Name & Username */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight truncate">
                {agent.name}
              </h1>
              <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-sm">
                @{agent.username}
              </p>
            </div>

            {/* Meta Row: Owner + Messages */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 sm:mt-4 text-xs sm:text-sm">
              {/* Owner */}
              <Link
                href={`/creators/${agent.owner.username}`}
                className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
                  {agent.owner.userImage ? (
                    <AvatarImage
                      src={agent.owner.userImage}
                      alt={agent.owner.username}
                    />
                  ) : (
                    <AvatarFallback className="text-[8px] sm:text-[10px]">
                      {agent.owner.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span>by {agent.owner.username}</span>
              </Link>

              <span className="text-muted-foreground/40">·</span>

              {/* Message Count */}
              <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                <MessageSquareIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{formatCompactNumber(messageCount)} messages</span>
              </div>
            </div>

            {/* Description */}
            {agent.description && (
              <div className="mt-2 sm:mt-3 max-w-2xl">
                <TextClampMore
                  lines={2}
                  text={agent.description}
                  className="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                />
              </div>
            )}

            {/* Action Buttons - Hidden on mobile */}
            <div className="hidden sm:flex flex-wrap items-center gap-3 mt-5">
              <Button
                size="lg"
                className="gap-2 px-6"
                onClick={async () => {
                  if (await verifyAuth()) {
                    router.push(`/chat?agent=${agent.username}`)
                  }
                }}
              >
                <MessageSquareIcon className="h-4 w-4" />
                Chat with {agent.name}
              </Button>
              {canEditAgentSettings && (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 px-5"
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <SettingsIcon className="h-4 w-4" />
                  Edit agent
                </Button>
              )}
              {/* Context Menu */}
              {isSignedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem
                      onClick={evt => handleShareClick(evt, agent, dispatch)}
                    >
                      <Share2Icon className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    {isPinned ? (
                      <DropdownMenuItem onClick={handleUnpinAgent}>
                        <PinOffIcon className="mr-2 h-4 w-4" />
                        Unpin from sidebar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={handlePinAgent}
                        disabled={!canPin}
                      >
                        <PinIcon className="mr-2 h-4 w-4" />
                        {canPin ? 'Pin to sidebar' : 'Max 5 pins reached'}
                      </DropdownMenuItem>
                    )}
                    {hasOwnerAccess && !isPermissionsLoading && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleTogglePublic}>
                          {agent.public ? (
                            <>
                              <EyeOffIcon className="mr-2 h-4 w-4" />
                              Set Private
                            </>
                          ) : (
                            <>
                              <EyeIcon className="mr-2 h-4 w-4" />
                              Set Public
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleDeleteAgent}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-only: Action Buttons */}
        <div className="flex sm:hidden items-center gap-2 mt-4">
          <Button
            className="flex-1 gap-2"
            onClick={async () => {
              if (await verifyAuth()) {
                router.push(`/chat?agent=${agent.username}`)
              }
            }}
          >
            <MessageSquareIcon className="h-4 w-4" />
            Chat
          </Button>
          {canEditAgentSettings && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          )}
          {isSignedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={evt => handleShareClick(evt, agent, dispatch)}
                >
                  <Share2Icon className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                {isPinned ? (
                  <DropdownMenuItem onClick={handleUnpinAgent}>
                    <PinOffIcon className="mr-2 h-4 w-4" />
                    Unpin from sidebar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handlePinAgent} disabled={!canPin}>
                    <PinIcon className="mr-2 h-4 w-4" />
                    {canPin ? 'Pin to sidebar' : 'Max 5 pins reached'}
                  </DropdownMenuItem>
                )}
                {hasOwnerAccess && !isPermissionsLoading && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleTogglePublic}>
                      {agent.public ? (
                        <>
                          <EyeOffIcon className="mr-2 h-4 w-4" />
                          Set Private
                        </>
                      ) : (
                        <>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Set Public
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteAgent}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Creations Section - Full Width */}
      <section ref={feedSectionRef} className="flex-1">
        {/* Section Header + Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
          {showFilterTabs ? (
            <Tabs
              value={filterMode}
              onValueChange={value => setFilterMode(value as FilterMode)}
            >
              <TabsList>
                <TabsTrigger value="all">All Creations</TabsTrigger>
                <TabsTrigger value="mine">My Creations</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <h2 className="text-sm text-muted-foreground">
              Creations with {agent.name}
            </h2>
          )}
        </div>

        {/* Full-Width Creations Feed */}
        <div className="w-full">
          <RecentCreationsFeed
            query={recentCreationsQuery}
            initialScrollIndex={initialScrollIndex}
            onScrollRestored={clearScrollIndexState}
          />
        </div>
      </section>

      {/* Settings Modal */}
      <AgentSettingsModal
        agentId={agent.username || agent._id}
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
        initialTab="profile"
      />
    </div>
  )
}

export default AgentDetail
