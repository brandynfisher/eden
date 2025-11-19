'use client'

import MyAgentCard from '@/components/card/my-agent-card'
import { ExploreAgentsGrid } from '@/components/explore-agents-grid'
import FeedSearchForm from '@/components/filter/feed-search-form'
import { useAppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { AgentDashboardModal } from '@/features/agent/agent-dashboard-modal'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import {
  useRenderCount,
  useRenderTime,
  useUpdateThrottle,
  useWhyDidYouUpdate,
} from '@/lib/performance-debug'
import { sortMyAgentsByPreference } from '@/lib/sort-agents-by-preference'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { EditIcon, MenuIcon, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const AgentsPage = () => {
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const { user } = useAuthState()
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [dashboardAgentId, setDashboardAgentId] = useState<string | null>(null)
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)

  // Get user preferences for agent sorting
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!user })

  // Performance debugging - remove after diagnosing
  useRenderCount('AgentsPage')
  useRenderTime('AgentsPage')

  // Query for user's agents - filter by owner, sort by message count
  // Fetch more than display limit to ensure we get all last_agents for sorting
  const query: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 20, // Fetch more to ensure we get all last_agents, then slice to 6 after sorting
      ...(user?._id ? { owner: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: ['stats.messageCount;-1'],
    }),
    [user?._id, searchQuery],
  )

  interface AgentPage {
    docs: Agent[]
    nextCursor?: string
  }

  const { data, isLoading } = useInfiniteQuery<AgentPage>({
    queryKey: ['feed', 'agents', 'my-agents', query],
    queryFn: ({ pageParam }): Promise<AgentPage> => {
      const paginationRoute = createCursorPaginationRoute('/api/feed/agents', {
        ...query,
        cursor: (pageParam as string) || '',
        limit: 20, // Match query limit
      })
      return fetcher(paginationRoute)
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialPageParam: '',
    enabled: !!user?._id,
  })

  // Get agents from pages and sort by user preference
  const myAgents = useMemo(() => {
    if (!data?.pages) return []
    const allAgents = data.pages.flatMap(page => page.docs || []) as Agent[]
    // Presort: top 5 from last_agents first, then by message count. Limit to 6 for display
    const sorted = sortMyAgentsByPreference(allAgents, lastAgents, user?._id)
    return sorted.slice(0, 6)
  }, [data, lastAgents, user?._id])

  // More performance debugging
  useWhyDidYouUpdate('AgentsPage', {
    user,
    searchQuery,
    settingsAgentId,
    dashboardAgentId,
    myAgentsLength: myAgents.length,
  })
  useUpdateThrottle('AgentsPage-data', data)

  // Query for public agents - user's own agents will be filtered out in the component
  const exploreAgentsQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: user ? 15 : 30, // 30 when not logged in, 15 when logged in
      sort: ['stats.messageCount;-1'],
    }),
    [user],
  )

  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
            }}
            className="flex items-center gap-2"
          >
            <span className="text-lg font-semibold">Agents</span>
          </button>
          <button
            onClick={() => {
              close()
              setIsAgentSelectorOpen(true)
            }}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="New Chat"
          >
            <EditIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, setConfig, setIsAgentSelectorOpen])

  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">Agents</h1>
        <div className="ml-auto">
          <button
            onClick={() => setIsAgentSelectorOpen(true)}
            className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
            aria-label="New chat"
          >
            <EditIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          <div className="p-4 md:p-6 lg:p-8">
            {/* My Agents Section - Only shown when logged in */}
            {user && (
              <>
                {/* My Agents Section Title */}
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold">My Agents</h2>
                </div>

                {/* Search bar and New Agent button */}
                <div className="mb-6 flex gap-3">
                  <FeedSearchForm
                    handleSearch={setSearchQuery}
                    className="flex-1 md:flex-initial md:w-[420px]"
                  />
                  <Button asChild size="default" className="gap-2">
                    <Link href="/new/agent">
                      <UserPlus className="w-4 h-4" />
                      New Agent
                    </Link>
                  </Button>
                </div>

                {/* Agents grid - 2 rows, 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                  {isLoading ? (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-64 bg-muted animate-pulse rounded-lg"
                        />
                      ))}
                    </>
                  ) : myAgents.length > 0 ? (
                    myAgents.map(agent => (
                      <MyAgentCard
                        key={agent._id}
                        agent={agent}
                        userId={user._id}
                        onSettingsClick={() =>
                          setSettingsAgentId(agent.username)
                        }
                        onDashboardClick={() =>
                          setDashboardAgentId(agent.username)
                        }
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? 'No agents found matching your search'
                          : 'You have no agents yet'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Explore Agents Section */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  Explore Agents
                </h2>
                <p className="text-muted-foreground mt-1">
                  Discover and chat with AI agents created by the community
                </p>
              </div>

              <ExploreAgentsGrid query={exploreAgentsQuery} />
            </div>

            {/* Agent Selector Modal */}
            <SingleAgentSelectorModal
              open={isAgentSelectorOpen}
              onOpenChange={setIsAgentSelectorOpen}
              onSelect={agent => {
                setIsAgentSelectorOpen(false)
                window.location.href = `/chat/${agent.username}`
              }}
            />

            {/* Agent Settings Modal */}
            {settingsAgentId && (
              <AgentSettingsModal
                agentId={settingsAgentId}
                open={!!settingsAgentId}
                onOpenChange={open => !open && setSettingsAgentId(null)}
              />
            )}

            {/* Agent Dashboard Modal */}
            {dashboardAgentId && (
              <AgentDashboardModal
                agentId={dashboardAgentId}
                open={!!dashboardAgentId}
                onOpenChange={open => !open && setDashboardAgentId(null)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AgentsPage
