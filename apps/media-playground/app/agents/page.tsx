'use client'

import AgentCard from '@/components/card/agent-card'
import FeedSearchForm from '@/components/filter/feed-search-form'
import { useAppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { FeaturedAgents } from '@/features/agent/featured-agents'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import {
  Agent,
  AgentPermissionLevel,
  FeedAgentCursorArguments,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { EditIcon, MenuIcon, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type AgentScope = 'mine' | 'shared' | 'public'

const AgentsPage = () => {
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const {
    user,
    isLoading: isAuthLoading,
    isSignedIn,
    verifyAuth,
  } = useAuthState()

  const [searchInputValue, setSearchInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [scope, setScope] = useState<AgentScope>('public')
  const [didSetDefaultScope, setDidSetDefaultScope] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const { lastAgents, isLoading: isPreferencesLoading } =
    useUserPreferencesQuery({
      enabled: !!isSignedIn,
      populateOwner: true,
    })
  // Always fetch shared agents when signed in (needed for permission checks in search)
  const { sharedAgents, isLoading: isSharedLoading } = useSharedAgentsQuery({
    enabled: !!isSignedIn,
  })

  // Keep mobile shell controls aligned with the layout
  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => close()} className="flex items-center gap-2">
            <span className="text-lg font-semibold">Agents</span>
          </button>
          <button
            onClick={async () => {
              if (!(await verifyAuth())) return
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
  }, [resetConfig, setConfig, verifyAuth])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // If user logs out, force public scope
  useEffect(() => {
    if (!isSignedIn && scope !== 'public') {
      setScope('public')
      setDidSetDefaultScope(false)
    }
  }, [isSignedIn, scope])

  // Default to Mine once authenticated (but allow switching after)
  useEffect(() => {
    if (isSignedIn && !didSetDefaultScope) {
      setScope('mine')
      setDidSetDefaultScope(true)
    }
  }, [didSetDefaultScope, isSignedIn])

  // Clear agentId after modal closes to prevent re-render issues during exit animation
  useEffect(() => {
    if (!isSettingsModalOpen && settingsAgentId) {
      const timer = setTimeout(() => {
        setSettingsAgentId(null)
      }, 200) // Wait for exit animation to complete
      return () => clearTimeout(timer)
    }
  }, [isSettingsModalOpen, settingsAgentId])

  const recentAgents = useMemo(() => {
    const seen = new Set<string>()
    return (lastAgents || [])
      .filter(agent => {
        if (seen.has(agent._id)) return false
        seen.add(agent._id)
        return true
      })
      .slice(0, 3)
  }, [lastAgents])

  const recentAgentsWithDescriptions = recentAgents

  const myAgentsQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 40,
      ...(user?._id ? { owner: user._id } : {}),
      sort: ['stats.messageCount;-1'],
    }),
    [user?._id],
  )

  // Helper to check if the user has edit access to an agent
  // Checks: 1) original owner, 2) co-owner/co-editor via shared agents
  const hasAgentEditAccess = useCallback(
    (
      agent: Agent | { _id: string; owner?: string | { _id?: string } },
    ): boolean => {
      if (!user?._id) return false

      // Check if user is the original owner
      if (agent?.owner) {
        const ownerId =
          typeof agent.owner === 'string' ? agent.owner : agent.owner._id
        if (ownerId === user._id) return true
      }

      // Check if user has edit access via sharing (co-owner or co-editor)
      const sharedAgent = sharedAgents.find(sa => sa.agent._id === agent._id)
      if (sharedAgent) {
        return (
          sharedAgent.permissionLevel === AgentPermissionLevel.Owner ||
          sharedAgent.permissionLevel === AgentPermissionLevel.Editor
        )
      }

      return false
    },
    [user?._id, sharedAgents],
  )

  const myAgentsQueryKey = useMemo(
    () => ['feed', 'agents', 'mine', myAgentsQuery],
    [myAgentsQuery],
  )

  const { data: myAgentsData, isLoading: isMyAgentsLoading } = useQuery({
    queryKey: myAgentsQueryKey,
    enabled: scope === 'mine' && isSignedIn,
    queryFn: () =>
      fetcher<{ docs: Agent[]; nextCursor?: string }>(
        createCursorPaginationRoute('/api/feed/agents', {
          ...myAgentsQuery,
          cursor: '',
          limit: myAgentsQuery.limit || 40,
        }),
      ),
    staleTime: 30_000,
  })

  const myAgents = useMemo(() => myAgentsData?.docs || [], [myAgentsData])

  const isRecentLoading = isSignedIn && isPreferencesLoading
  const isScopeLoading =
    (scope === 'mine' && isMyAgentsLoading) ||
    (scope === 'shared' && isSharedLoading)
  const isPageLoading =
    !hasMounted ||
    isAuthLoading ||
    (isSignedIn && (isRecentLoading || isScopeLoading))

  const publicAgentsQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 40,
      sort: ['stats.messageCount;-1'],
      // Backend already applies public: true by default
      ...(user?._id ? { excludeOwner: user._id } : {}),
    }),
    [user?._id],
  )

  const publicAgentsQueryKey = useMemo(
    () => ['feed', 'agents', 'public', publicAgentsQuery],
    [publicAgentsQuery],
  )

  const { data: publicAgentsData, isLoading: isPublicAgentsLoading } = useQuery(
    {
      queryKey: publicAgentsQueryKey,
      enabled: scope === 'public',
      queryFn: () =>
        fetcher<{ docs: Agent[]; nextCursor?: string }>(
          createCursorPaginationRoute('/api/feed/agents', {
            ...publicAgentsQuery,
            cursor: '',
            limit: publicAgentsQuery.limit || 40,
          }),
        ),
      staleTime: 30_000,
    },
  )

  const publicAgents = useMemo(
    () => publicAgentsData?.docs || [],
    [publicAgentsData],
  )

  // Search query - respects current scope (mine/shared/public)
  const searchQueryArgs: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 40,
      search: searchQuery,
      sort: ['stats.messageCount;-1'],
      // Apply scope-specific filters
      ...(scope === 'mine' && user?._id ? { owner: user._id } : {}),
      ...(scope === 'public' && user?._id ? { excludeOwner: user._id } : {}),
    }),
    [searchQuery, scope, user?._id],
  )

  const { data: searchResultsData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['feed', 'agents', 'search', scope, searchQueryArgs],
    enabled: !!searchQuery && scope !== 'shared',
    queryFn: () =>
      fetcher<{ docs: Agent[]; nextCursor?: string }>(
        createCursorPaginationRoute('/api/feed/agents', {
          ...searchQueryArgs,
          cursor: '',
          limit: 40,
        }),
      ),
    staleTime: 30_000,
  })

  const searchResults = useMemo(
    () => searchResultsData?.docs || [],
    [searchResultsData],
  )

  const filteredSharedAgents = useMemo(() => {
    return [...sharedAgents].sort((a, b) => {
      const aCount = a.agent?.stats?.messageCount || 0
      const bCount = b.agent?.stats?.messageCount || 0
      return bCount - aCount
    })
  }, [sharedAgents])

  // Client-side search for shared agents
  const searchedSharedAgents = useMemo(() => {
    if (!searchQuery || scope !== 'shared') return []

    const searchLower = searchQuery.toLowerCase()
    return filteredSharedAgents.filter(
      ({ agent }) =>
        agent.name?.toLowerCase().includes(searchLower) ||
        agent.description?.toLowerCase().includes(searchLower) ||
        agent.username?.toLowerCase().includes(searchLower),
    )
  }, [searchQuery, scope, filteredSharedAgents])

  const renderFeaturedAgents = () => {
    if (isSignedIn) return null

    return (
      <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/15 via-violet-500/12 to-fuchsia-500/10 p-4 md:p-5 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-fuchsia-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Featured agents</h2>
          </div>
        </div>

        <div className="relative mt-4">
          <FeaturedAgents />
        </div>
      </Card>
    )
  }

  const renderRecentAgents = () => {
    if (!isSignedIn || recentAgents.length === 0) return null

    return (
      <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/15 via-violet-500/12 to-fuchsia-500/10 p-4 md:p-5 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-fuchsia-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Recent agents</h2>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentAgentsWithDescriptions.map(agent => (
            <AgentCard
              key={agent._id}
              agent={agent as Agent}
              improvedLayout
              hideContextMenu
              showSettings={hasAgentEditAccess(agent)}
              onSettings={() => {
                setSettingsAgentId(agent.username || agent._id)
                setIsSettingsModalOpen(true)
              }}
            />
          ))}
        </div>
      </Card>
    )
  }

  const renderScopeFeed = () => {
    if (scope === 'shared') {
      if (!isSignedIn) {
        return (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            Sign in to see agents shared with you.
          </div>
        )
      }

      if (isSharedLoading) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[200px] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        )
      }

      if (filteredSharedAgents.length === 0) {
        return (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No one has shared agents with you yet.
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSharedAgents.map(({ agent, permissionLevel }) => {
            // Show settings for shared agents if user has owner or editor access
            const hasEditAccess =
              permissionLevel === AgentPermissionLevel.Owner ||
              permissionLevel === AgentPermissionLevel.Editor
            return (
              <AgentCard
                key={agent._id}
                agent={agent as Agent}
                improvedLayout
                hideContextMenu
                showSettings={hasEditAccess}
                onSettings={() => {
                  setSettingsAgentId(agent.username || agent._id)
                  setIsSettingsModalOpen(true)
                }}
              />
            )
          })}
        </div>
      )
    }

    if (scope === 'public') {
      if (isPublicAgentsLoading) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[200px] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        )
      }

      if (!publicAgents.length) {
        return (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No public agents available.
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {publicAgents.map(agent => (
            <AgentCard
              key={agent._id}
              agent={agent}
              improvedLayout
              hideContextMenu
            />
          ))}
        </div>
      )
    }

    // Mine (default)
    if (isMyAgentsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      )
    }

    if (!myAgents.length) {
      return (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          You have not created any agents yet.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {myAgents.map(agent => (
          <AgentCard
            key={agent._id}
            agent={agent}
            improvedLayout
            hideContextMenu
            showSettings={hasAgentEditAccess(agent)}
            onSettings={() => {
              setSettingsAgentId(agent.username || agent._id)
              setIsSettingsModalOpen(true)
            }}
          />
        ))}
      </div>
    )
  }

  const renderSearchResults = () => {
    // For shared agents, use client-side filtered results
    if (scope === 'shared') {
      if (searchedSharedAgents.length === 0) {
        return (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No agents match your search.
          </div>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {searchedSharedAgents.map(({ agent, permissionLevel }) => {
            const hasEditAccess =
              permissionLevel === AgentPermissionLevel.Owner ||
              permissionLevel === AgentPermissionLevel.Editor
            return (
              <AgentCard
                key={agent._id}
                agent={agent as Agent}
                improvedLayout
                hideContextMenu
                showSettings={hasEditAccess}
                onSettings={() => {
                  setSettingsAgentId(agent.username || agent._id)
                  setIsSettingsModalOpen(true)
                }}
              />
            )
          })}
        </div>
      )
    }

    // For mine and public, use API search results
    if (isSearchLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      )
    }

    if (searchResults.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No agents match your search.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {searchResults.map(agent => (
          <AgentCard
            key={agent._id}
            agent={agent}
            improvedLayout
            hideContextMenu
            showSettings={hasAgentEditAccess(agent)}
            onSettings={() => {
              setSettingsAgentId(agent.username || agent._id)
              setIsSettingsModalOpen(true)
            }}
          />
        ))}
      </div>
    )
  }

  const handleStartChat = useCallback(async () => {
    if (!(await verifyAuth())) return
    setIsAgentSelectorOpen(true)
  }, [verifyAuth])

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
            onClick={handleStartChat}
            className="p-1 hover:bg-muted/10 rounded-lg transition-colors"
            aria-label="New chat"
          >
            <EditIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6">
            <header className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1 hidden md:block">
                  <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleStartChat}
                  >
                    <EditIcon className="h-4 w-4" />
                    Start a chat
                  </Button>
                  <Button asChild className="gap-2">
                    <Link
                      href="/new/agent"
                      onClick={async event => {
                        if (!(await verifyAuth())) {
                          event.preventDefault()
                          event.stopPropagation()
                        }
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      New agent
                    </Link>
                  </Button>
                </div>
              </div>
            </header>

            {isPageLoading ? (
              <div className="space-y-4">
                <Card className="h-[200px] bg-muted/60 border-border/50 animate-pulse" />
                <Card className="h-[420px] bg-muted/60 border-border/50 animate-pulse" />
              </div>
            ) : (
              <>
                {renderFeaturedAgents()}
                {renderRecentAgents()}

                <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 md:p-5 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">Browse agents</h2>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs
                      value={scope}
                      onValueChange={value => setScope(value as AgentScope)}
                    >
                      <TabsList className="flex flex-wrap gap-2 bg-muted/50 p-1">
                        <TabsTrigger
                          value="mine"
                          disabled={!isSignedIn}
                          className="text-sm"
                        >
                          Mine
                        </TabsTrigger>
                        <TabsTrigger
                          value="shared"
                          disabled={!isSignedIn}
                          className="text-sm"
                        >
                          Shared
                        </TabsTrigger>
                        <TabsTrigger value="public" className="text-sm">
                          Public
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full lg:w-auto">
                      <FeedSearchForm
                        value={searchInputValue}
                        onInputChange={setSearchInputValue}
                        handleSearch={setSearchQuery}
                        className="w-full sm:w-[260px] lg:w-[320px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {searchQuery
                        ? `Search results for "${searchQuery}"`
                        : scope === 'mine'
                        ? 'Your agents'
                        : scope === 'shared'
                        ? 'Shared with you'
                        : 'Popular across Eden'}
                    </p>
                    {searchQuery ? renderSearchResults() : renderScopeFeed()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SingleAgentSelectorModal
        open={isAgentSelectorOpen}
        onOpenChange={setIsAgentSelectorOpen}
        onSelect={agent => {
          setIsAgentSelectorOpen(false)
          window.location.href = `/chat/${agent.username}`
        }}
      />

      {settingsAgentId && (
        <AgentSettingsModal
          agentId={settingsAgentId}
          open={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
        />
      )}
    </>
  )
}

export default AgentsPage
