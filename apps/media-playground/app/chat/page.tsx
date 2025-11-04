'use client'

import MyAgentCard from '@/components/card/my-agent-card'
import FeedSearchForm from '@/components/filter/feed-search-form'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import { cn } from '@/lib/utils'
import { Agent, FeedAgentCursorArguments } from '@edenlabs/eden-sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

const ChatPage = () => {
  const { user } = useAuthState()
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Query for user's agents - filter by owner, sort by message count
  const query: FeedAgentCursorArguments = useMemo(
    () => ({
      limit: 3,
      ...(user?._id ? { owner: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: ['stats.userMessageCount;-1'],
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
        limit: 3,
      })
      return fetcher(paginationRoute)
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialPageParam: '',
    enabled: !!user?._id,
  })

  // Get agents from pages
  const myAgents = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.docs || []).slice(0, 3) as Agent[]
  }, [data])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">
          Please sign in to view your agents
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col fixed inset-0">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 !overflow-y-hidden"
      >
        {/* DESKTOP-ONLY RESIZABLE SIDEBAR */}
        <ResizablePanel
          defaultSize={20}
          minSize={isSidebarCollapsed ? 0 : 15}
          maxSize={30}
          collapsible={false}
          className={cn(
            'hidden md:flex md:flex-col bg-accent border-r transition-all duration-300 ease-in-out',
            isSidebarCollapsed
              ? 'min-w-[56px] max-w-[56px] w-[56px] p-1.5'
              : 'max-w-[320px] pl-3 pr-0 pt-0 pb-0',
          )}
        >
          {isSidebarCollapsed ? (
            <SessionsSidebarContent
              onSidebarToggle={() => setIsSidebarCollapsed(false)}
              isCollapsed={true}
            />
          ) : (
            <SessionsSidebarContent
              onSidebarToggle={() => setIsSidebarCollapsed(true)}
            />
          )}
        </ResizablePanel>

        {/* Separator Handle - hidden, keeping for resizing functionality */}
        <ResizableHandle className="hidden md:flex w-2 bg-transparent" />

        {/* MAIN CONTENT PANEL */}
        <ResizablePanel
          defaultSize={80}
          className="relative flex flex-col bg-background -ml-px"
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div className="mx-auto flex flex-col h-full w-full overflow-y-auto">
              <div className="p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">
                    My Agents
                  </h1>
                </div>

                {/* Search bar */}
                <div className="mb-6">
                  <FeedSearchForm
                    handleSearch={setSearchQuery}
                    className="max-w-md"
                  />
                </div>

                {/* Agents grid - single row, 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoading ? (
                    <>
                      {[...Array(3)].map((_, i) => (
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

                {/* Agent Settings Modal */}
                {settingsAgentId && (
                  <AgentSettingsModal
                    agentId={settingsAgentId}
                    open={!!settingsAgentId}
                    onOpenChange={open => !open && setSettingsAgentId(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default ChatPage
