'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { useAppShell } from '@/components/layout/app-shell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import AgentsFeed from '@/features/feed/agents-feed'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useSharedAgentsQuery } from '@/hooks/query/use-shared-agents-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import {
  Agent,
  FeedAgentCursorArguments,
  MinimalAgent,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import {
  EditIcon,
  MenuIcon,
  MessageSquareIcon,
  SettingsIcon,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const { sharedAgents, isLoading: isSharedLoading } = useSharedAgentsQuery({
    enabled: scope === 'shared' && isSignedIn,
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

  const recentAgents = useMemo(
    () => (lastAgents || []).slice(0, 3),
    [lastAgents],
  )

  const recentAgentsWithDescriptions = recentAgents

  const myAgentsQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 40,
      ...(user?._id ? { owner: user._id } : {}),
      sort: ['stats.messageCount;-1'],
    }),
    [user?._id],
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

  // Unified search query - searches all eligible agents (mine + public)
  const unifiedSearchQuery: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 40,
      search: searchQuery,
      sort: ['stats.messageCount;-1'],
    }),
    [searchQuery],
  )

  const { data: unifiedSearchData, isLoading: isUnifiedSearchLoading } =
    useQuery({
      queryKey: ['feed', 'agents', 'unified-search', unifiedSearchQuery],
      enabled: !!searchQuery,
      queryFn: () =>
        fetcher<{ docs: Agent[]; nextCursor?: string }>(
          createCursorPaginationRoute('/api/feed/agents', {
            ...unifiedSearchQuery,
            cursor: '',
            limit: 40,
          }),
        ),
      staleTime: 30_000,
    })

  const unifiedSearchResults = useMemo(
    () => unifiedSearchData?.docs || [],
    [unifiedSearchData],
  )

  const filteredSharedAgents = useMemo(() => {
    return [...sharedAgents].sort((a, b) => {
      const aCount = a.agent?.stats?.messageCount || 0
      const bCount = b.agent?.stats?.messageCount || 0
      return bCount - aCount
    })
  }, [sharedAgents])

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

        <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentAgentsWithDescriptions.map(agent => (
            <RecentAgentTile
              key={agent._id}
              agent={agent}
              currentUserId={user?._id}
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
              <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />
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
          {filteredSharedAgents.map(({ agent }) => (
            <LibraryAgentCard
              key={agent._id}
              agent={agent as Agent}
              currentUserId={user?._id}
              onSettings={() => {
                setSettingsAgentId(agent.username || agent._id)
                setIsSettingsModalOpen(true)
              }}
            />
          ))}
        </div>
      )
    }

    if (scope === 'public') {
      return (
        <AgentsFeed
          query={publicAgentsQuery}
          minCols={1}
          maxCols={3}
          hideCreateButton={true}
          improvedLayout={true}
          hideContextMenu={true}
          breakpoints={[
            { minWidth: 1280, columns: 3 },
            { minWidth: 768, columns: 2 },
            { minWidth: 0, columns: 1 },
          ]}
          renderCard={agent => (
            <LibraryAgentCard
              key={agent._id}
              agent={agent}
              currentUserId={user?._id}
              onSettings={() => {
                setSettingsAgentId(agent.username || agent._id)
                setIsSettingsModalOpen(true)
              }}
            />
          )}
        />
      )
    }

    // Mine (default)
    if (isMyAgentsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />
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
          <LibraryAgentCard
            key={agent._id}
            agent={agent}
            currentUserId={user?._id}
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
    if (isUnifiedSearchLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )
    }

    if (unifiedSearchResults.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No agents match your search.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {unifiedSearchResults.map(agent => (
          <LibraryAgentCard
            key={agent._id}
            agent={agent}
            currentUserId={user?._id}
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

const RecentAgentTile = ({
  agent,
  onSettings,
  currentUserId,
}: {
  agent: Agent | MinimalAgent
  onSettings?: () => void
  currentUserId?: string
}) => {
  const router = useRouter()
  const messageCount =
    (agent as Agent)?.stats?.messageCount ||
    (agent as unknown as { messageCount?: number })?.messageCount ||
    0
  const imageSrc = agent.userImage
    ? getCloudfrontOriginalUrl(agent.userImage)
    : undefined
  const description =
    (agent as Agent)?.description ||
    (agent as unknown as { description?: string })?.description ||
    'Jump back into this conversation.'
  const username = agent.username || (agent as Agent)?._id
  const { hasEditAccess, isLoading: isPermissionsLoading } =
    useAgentPermissions(agent, currentUserId)

  return (
    <div
      className={cn(
        'group flex flex-row rounded-xl border bg-background/70 backdrop-blur-sm cursor-pointer relative',
        'border-border/70 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10',
        'transition-all duration-200 h-full overflow-hidden',
      )}
      onClick={() => router.push(`/agents/${username}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/agents/${username}`)
        }
      }}
    >
      {/* Square avatar on left */}
      <div className="shrink-0 w-32 self-stretch flex items-center justify-center p-3">
        <Avatar className="w-full aspect-square rounded-lg">
          <AvatarImage
            src={imageSrc}
            alt={agent.name || agent.username}
            className="object-cover"
          />
          <AvatarFallback className="text-3xl rounded-lg">
            {(agent.name || agent.username)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content on right */}
      <div className="flex flex-col flex-1 min-w-0 p-3">
        {/* Settings button - top right */}
        {hasEditAccess && !isPermissionsLoading && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 absolute top-2 right-2"
            onClick={e => {
              e.stopPropagation()
              onSettings?.()
            }}
            aria-label="Agent settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        )}

        <div className="min-w-0 pr-8">
          <p className="font-semibold truncate leading-tight">
            {agent.name || agent.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            by @
            {typeof (agent as Agent).owner === 'object'
              ? (agent as Agent).owner?.username
              : agent.username}
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2">
          {messageCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquareIcon className="h-3 w-3" />
              {formatCompactNumber(messageCount)} messages
            </span>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs ml-auto"
            onClick={e => {
              e.stopPropagation()
              router.push(`/chat?agent=${username}`)
            }}
          >
            Start chat
          </Button>
        </div>
      </div>
    </div>
  )
}

const LibraryAgentCard = ({
  agent,
  onSettings,
  currentUserId,
}: {
  agent: Agent
  onSettings?: () => void
  currentUserId?: string
}) => {
  const router = useRouter()
  const imageSrc = agent.userImage
    ? getCloudfrontOriginalUrl(agent.userImage)
    : undefined
  const description = agent.description || 'No description provided yet.'
  const { hasEditAccess, isLoading: isPermissionsLoading } =
    useAgentPermissions(agent, currentUserId)

  return (
    <div
      className={cn(
        'group flex flex-row rounded-xl border bg-background/80 backdrop-blur-sm cursor-pointer relative',
        'border-border/70 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10',
        'transition-all duration-200 h-full overflow-hidden',
      )}
      onClick={() => router.push(`/agents/${agent.username}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/agents/${agent.username}`)
        }
      }}
    >
      {/* Square avatar on left */}
      <div className="shrink-0 w-32 self-stretch flex items-center justify-center p-3">
        <Avatar className="w-full aspect-square rounded-lg">
          <AvatarImage
            src={imageSrc}
            alt={agent.name || agent.username}
            className="object-cover"
          />
          <AvatarFallback className="text-3xl rounded-lg">
            {(agent.name || agent.username)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content on right */}
      <div className="flex flex-col flex-1 min-w-0 p-3">
        {/* Settings button - top right */}
        {hasEditAccess && !isPermissionsLoading && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 absolute top-2 right-2"
            onClick={e => {
              e.stopPropagation()
              onSettings?.()
            }}
            aria-label="Agent settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        )}

        <div className="min-w-0 pr-8">
          <p className="font-semibold truncate leading-tight">
            {agent.name || agent.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            by @{agent.owner?.username || agent.username}
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageSquareIcon className="h-3 w-3" />
            {formatCompactNumber(agent.stats?.messageCount || 0)} messages
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs ml-auto"
            onClick={e => {
              e.stopPropagation()
              router.push(`/chat?agent=${agent.username}`)
            }}
          >
            Start chat
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AgentsPage
