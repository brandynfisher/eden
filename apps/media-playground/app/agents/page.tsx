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
  UserIcon,
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
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: ['createdAt;-1'],
    }),
    [user?._id, searchQuery],
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
      ...(searchQuery ? { search: searchQuery } : {}),
    }),
    [searchQuery],
  )

  const filteredSharedAgents = useMemo(() => {
    const sorted = [...sharedAgents].sort((a, b) => {
      const aCount = a.agent?.stats?.messageCount || 0
      const bCount = b.agent?.stats?.messageCount || 0
      return bCount - aCount
    })

    if (!searchQuery) return sorted
    const query = searchQuery.toLowerCase()

    return sorted.filter(({ agent }) => {
      const haystack = [
        agent.name,
        agent.description,
        agent.username,
        agent.owner?.username,
      ]
      return haystack.some(
        value => value && value.toLowerCase().includes(query),
      )
    })
  }, [sharedAgents, searchQuery])

  const renderRecentAgents = () => {
    if (!isSignedIn || recentAgents.length === 0) return null

    return (
      <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/10 to-emerald-500/10 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Recent agents</h2>
            <p className="text-sm text-muted-foreground">
              The last few agents you've spoken with - jump back in.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            {searchQuery
              ? 'No shared agents match your search.'
              : 'No one has shared agents with you yet.'}
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
          maxCols={4}
          hideCreateButton={true}
          improvedLayout={true}
          hideContextMenu={true}
          breakpoints={[
            { minWidth: 1536, columns: 5 },
            { minWidth: 1280, columns: 4 },
            { minWidth: 1024, columns: 3 },
            { minWidth: 768, columns: 2 },
            { minWidth: 0, columns: 1 },
          ]}
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
          {searchQuery
            ? 'No agents match your search.'
            : 'You have not created any agents yet.'}
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
                <div className="space-y-1">
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
                        handleSearch={setSearchQuery}
                        className="w-full sm:w-[260px] lg:w-[320px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {scope === 'mine' && 'Your agents'}
                      {scope === 'shared' && 'Shared with you'}
                      {scope === 'public' && 'Popular across Eden'}
                    </p>
                    {renderScopeFeed()}
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
  agent: MinimalAgent | Agent
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
        'group flex flex-col gap-3 rounded-xl border bg-background/70 backdrop-blur-sm cursor-pointer',
        'border-border/70 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10',
        'transition-all duration-200 p-4 h-full',
      )}
      onClick={() => router.push(`/chat/${username}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/chat/${username}`)
        }
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={imageSrc} alt={agent.name || agent.username} />
          <AvatarFallback>
            {(agent.name || agent.username)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold truncate leading-tight">
            {agent.name || agent.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{agent.owner?.username || agent.username}
          </p>
        </div>
        <div className="flex gap-1 ml-auto">
          {hasEditAccess && !isPermissionsLoading && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={e => {
                e.stopPropagation()
                onSettings?.()
              }}
              aria-label="Agent settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            asChild
            onClick={e => e.stopPropagation()}
            aria-label="View agent profile"
          >
            <Link href={`/agents/${username}`}>
              <UserIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[42px]">
        {description}
      </p>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
        {messageCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquareIcon className="h-3 w-3" />
            {formatCompactNumber(messageCount)} messages
          </span>
        )}
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
        'group flex flex-col gap-3 rounded-xl border bg-background/80 backdrop-blur-sm cursor-pointer',
        'border-border/70 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10',
        'transition-all duration-200 p-4 h-full',
      )}
      onClick={() => router.push(`/chat/${agent.username}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/chat/${agent.username}`)
        }
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={imageSrc} alt={agent.name || agent.username} />
          <AvatarFallback>
            {(agent.name || agent.username)?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate leading-tight">
                {agent.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                By @{agent.owner?.username || 'unknown'}
              </p>
            </div>
            <div className="flex gap-1 ml-auto">
              {hasEditAccess && !isPermissionsLoading && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={e => {
                    e.stopPropagation()
                    onSettings?.()
                  }}
                  aria-label="Agent settings"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                asChild
                onClick={e => e.stopPropagation()}
                aria-label="View agent profile"
              >
                <Link href={`/agents/${agent.username}`}>
                  <UserIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 mt-1 min-h-[60px]">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
        <MessageSquareIcon className="h-3.5 w-3.5" />
        {formatCompactNumber(agent.stats?.messageCount || 0)} messages
      </div>
    </div>
  )
}

export default AgentsPage
