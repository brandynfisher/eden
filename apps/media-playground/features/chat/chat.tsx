'use client'

import { AgentBar } from './components/agent-bar'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { MarkdownText } from '@/components/ui/assistant-ui/markdown-text'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { MyComposer } from '@/features/chat/components/composer'
import Thread from '@/features/chat/components/thread'
import MyThreadWelcome from '@/features/chat/components/thread-welcome'
import { TaskResultTool } from '@/features/chat/components/tools/task-result-tool'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import AgentCreationsView from '@/features/chat/components/views/agent-creations-view'
import AgentEditView from '@/features/chat/components/views/agent-edit-view'
import AgentTasksView from '@/features/chat/components/views/agent-tasks-view'
import SingleAgentSelectorModal from '@/features/chat/components/views/single-agent-selector-modal'
import {
  MyRuntimeProvider,
  useEdenRuntimeExtras,
} from '@/features/chat/providers/my-runtime-provider'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useThreadListQuery } from '@/hooks/query/use-thread-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAssistantRuntime,
  useThreadListItem,
} from '@assistant-ui/react'
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  CheckIcon,
  EditIcon,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

const TopLeft: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const isNewSelected = useThreadListItem(t => t.id === 'DEFAULT_THREAD_ID')
  const threadId = useEdenRuntimeExtras(extras => extras.threadId)
  const isLoading = false

  // Only show as selected if we're in a new thread state (no threadId)
  const shouldShowSelected = !threadId && isNewSelected

  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="ghost"
        onClick={onItemClick}
        className={cn(
          'flex w-full justify-between px-3 mb-1',
          !isLoading && shouldShowSelected && 'bg-aui-muted',
        )}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>New Thread</span>
        </div>
        <EditIcon className="size-4" />
      </Button>
    </ThreadListPrimitive.New>
  )
}

const ThreadListItem: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const id = useThreadListItem(t => t.id)
  const title = useThreadListItem(t => t.title)
  const agentId = useEdenRuntimeExtras(extras => extras.agentId)
  const currentThreadId = useEdenRuntimeExtras(extras => extras.threadId)
  const { invalidate } = useThreadListQuery({ agentId })
  const runtime = useAssistantRuntime()
  const [isEditing, setIsEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const isSubmittingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isActive = id === currentThreadId

  const deleteThread = async (threadId: string) => {
    try {
      await axios.delete(`/api/threads/${threadId}`)

      if (threadId === id) {
        runtime.threads.switchToNewThread()
      }

      await invalidate()

      toast.success('Thread deleted', {
        description: 'Your thread has been deleted.',
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete thread', {
        description: 'Please try again later.',
        dismissible: true,
        richColors: true,
      })
    }
  }

  const renameThread = useCallback(async (threadId: string, title: string) => {
    if (!title) {
      setIsEditing(false)
      return
    }
    try {
      setIsRenaming(true)
      await axios.patch(`/api/threads/${threadId}`, {
        title,
      })

      await invalidate()

      toast.success('Thread renamed', {
        description: 'Your thread has been renamed.',
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to rename thread', {
        description: 'Please try again later.',
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsRenaming(false)
      setIsEditing(false)
    }
  }, [])

  const handleRenameSubmit = useCallback(
    async (event?: React.FormEvent | React.MouseEvent) => {
      event?.preventDefault()
      isSubmittingRef.current = true
      await renameThread(id, newTitle.trim())
    },
    [id, newTitle, renameThread],
  )

  const handleRenameCancel = useCallback(() => {
    if (!isSubmittingRef.current) {
      setIsEditing(false)
      setNewTitle('')
    }
    setTimeout(() => {
      isSubmittingRef.current = false
    }, 150)
  }, [])

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      isSubmittingRef.current = false
    }
  }, [isEditing])

  return (
    <ThreadListItemPrimitive.Root
      className={cn(
        'group flex justify-between hover:text-primary data-[active]:bg-muted data-[active]:text-primary font-normal data-[active]:font-medium hover:bg-muted/50 items-center gap-1 rounded-lg transition-all mr-1 text-sm relative',
        isActive && 'bg-muted text-primary font-medium',
      )}
    >
      <div className="flex-grow min-w-0 pl-1.5 pr-1 py-1.5 flex items-stretch">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-grow min-w-0">
            <Input
              id="thread-title-input"
              name="title"
              ref={inputRef}
              value={newTitle}
              disabled={isRenaming}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isRenaming) {
                  handleRenameSubmit(e)
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  handleRenameCancel()
                }
              }}
              onBlur={handleRenameCancel}
              className="h-8 flex-grow px-1 py-0 text-sm min-w-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 border-border"
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-primary hover:text-primary"
              onClick={handleRenameSubmit}
              onMouseDown={e => e.preventDefault()}
              disabled={isRenaming}
            >
              {isRenaming ? (
                <LoadingIndicator className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Save</span>
            </Button>
          </div>
        ) : (
          <ThreadListItemPrimitive.Trigger
            className="flex-grow min-w-0 text-left hover:bg-transparent disabled:opacity-100 disabled:pointer-events-none w-full self-stretch flex items-center"
            onClick={onItemClick}
            disabled={isEditing}
          >
            <div className="overflow-hidden whitespace-nowrap text-ellipsis">
              <ThreadListItemPrimitive.Title fallback="Untitled" />
            </div>
          </ThreadListItemPrimitive.Trigger>
        )}
      </div>

      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-7 w-7 mr-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Thread Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={() => {
                setIsEditing(true)
                setNewTitle(title || '')
              }}
            >
              <PencilIcon className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10"
              onSelect={e => {
                e.preventDefault()
                deleteThread(id)
              }}
            >
              <TrashIcon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ThreadListItemPrimitive.Root>
  )
}

const MainLeft: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const { isSignedIn, verifyAuth } = useAuthState()
  const agentId = useEdenRuntimeExtras(extras => extras.agentId)
  const { isLoading, hasMore, isFetchingNextPage, fetchNextPage } =
    useThreadListQuery({
      agentId,
      enabled: !!isSignedIn && !!agentId,
    })

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || isFetchingNextPage) {
      return
    }

    const target = document.getElementById('thread-list-observer-target')
    if (!target) {
      return
    }

    const container = target.closest('nav')
    if (!container) {
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          const scrollPosition = container.scrollTop

          fetchNextPage().then(() => {
            requestAnimationFrame(() => {
              container.scrollTop = scrollPosition
            })
          })
        }
      },
      {
        threshold: 1.0,
        rootMargin: '10px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage])

  return (
    <nav className="flex flex-col items-stretch gap-1 text-sm font-medium overflow-y-auto">
      <div className="mb-1 text-muted-foreground">Recent</div>
      {isLoading ? (
        <>
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
          <Skeleton className="w-full h-9" />
        </>
      ) : (
        <>
          {isSignedIn ? (
            <>
              <ThreadListPrimitive.Items
                components={{
                  ThreadListItem: props => (
                    <ThreadListItem {...props} onItemClick={onItemClick} />
                  ),
                }}
              />
              {hasMore && (
                <>
                  <div id="thread-list-observer-target" className="h-8 w-full">
                    <Separator orientation="horizontal" className="my-2" />
                    <div
                      className={cn(
                        'flex justify-center text-muted-foreground text-sm py-2',
                        isFetchingNextPage && 'text-purple-600',
                      )}
                    >
                      {isFetchingNextPage ? (
                        <LoadingIndicator className="w-4 h-4" />
                      ) : (
                        'Older Threads'
                      )}
                    </div>
                    <Separator orientation="horizontal" className="my-2" />
                  </div>
                </>
              )}
            </>
          ) : (
            <Button
              className="text-muted-foreground text-center"
              variant="link"
              onClick={verifyAuth}
            >
              Not signed in
            </Button>
          )}
        </>
      )}
    </nav>
  )
}

// Extracted Sidebar Content
const ChatSidebarContent: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  return (
    <>
      <div className="mb-4">
        <TopLeft onItemClick={onItemClick} />
      </div>
      <MainLeft onItemClick={onItemClick} />
    </>
  )
}

const LeftBarSheet: FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
}> = ({ open, onOpenChange }) => {
  const handleCloseSheet = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex flex-col max-h-full pt-10 px-3 bg-accent border-r gap-0"
      >
        <SheetTitle className="sr-only">Thread List</SheetTitle>
        <ChatSidebarContent onItemClick={handleCloseSheet} />
      </SheetContent>
    </Sheet>
  )
}

type Props = {
  agentId: string
  threadId?: string
  agentSSRData?: Agent
}

const Chat: FC<Props> = ({ agentId, threadId, agentSSRData }) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuthState()

  const {
    agent: agentClientData,
    isError,
    error,
    invalidate,
  } = useAgentQuery({
    key: agentId,
    initialData: agentSSRData
      ? {
          agent: agentSSRData,
        }
      : undefined,
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsMounted(true)

    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  const handleEditClick = () => {
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'update',
        agentId: agentId,
        onAction: async () => {
          await invalidate()
        },
      }),
    )
  }

  const agent = agentClientData || agentSSRData
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [viewMode, setViewMode] = useState<
    'chat' | 'creations' | 'tasks' | 'settings'
  >('chat')

  const isOwner = useMemo(() => {
    const ownershipStatus = user?._id === agent?.owner._id
    return ownershipStatus
  }, [user, agent])

  // Redirect non-owners away from owner-only views
  useEffect(() => {
    if (
      agent &&
      user &&
      !isOwner &&
      (viewMode === 'tasks' || viewMode === 'settings')
    ) {
      setViewMode('chat')
    }
  }, [agent, user, isOwner, viewMode])

  // Close agent selector modal when component unmounts (route change)
  useEffect(() => {
    return () => {
      setIsAgentSelectorOpen(false)
    }
  }, [])

  const handleAgentSelect = (selectedAgent: Agent) => {
    // If selecting the same agent we're already on, just close the modal
    if (selectedAgent.username === agentId) {
      setIsAgentSelectorOpen(false)
      return
    }

    router.push(`/chat/${selectedAgent.username}`)
    // Don't close modal immediately - it will close when navigation completes
  }

  const handleChatClick = () => {
    // Check if we're on mobile (window width < 768px for md breakpoint)
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // Mobile: Open the slideout sidebar
      setIsSheetOpen(true)
    } else {
      // Desktop: Start a new thread by navigating to base chat URL (no threadId)
      // This mimics the behavior of clicking "New Thread" in the sidebar
      router.push(`/chat/${agentId}`)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <MyRuntimeProvider agentId={agentId} threadId={threadId}>
      <div
        className="
         flex flex-col
         fixed
         inset-x-0
         bottom-0
         top-16
       "
      >
        {/* AGENT BAR - Always visible */}
        <AgentBar
          agent={agent}
          isOwner={isOwner}
          onChatClick={handleChatClick}
          onAgentSelect={() => setIsAgentSelectorOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* AGENT SELECTOR MODAL */}
        <SingleAgentSelectorModal
          open={isAgentSelectorOpen}
          onOpenChange={setIsAgentSelectorOpen}
          onSelect={handleAgentSelect}
        />

        {/* MOBILE-ONLY HEADER */}

        <LeftBarSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />

        {/* RESIZABLE LAYOUT FOR DESKTOP / MAIN CONTENT AREA */}

        {/* CONDITIONAL MAIN CONTENT BASED ON VIEW MODE */}
        {viewMode === 'creations' ? (
          /* CREATIONS VIEW - Full width */
          agent && <AgentCreationsView agent={agent} user={user} />
        ) : viewMode === 'tasks' ? (
          /* TASKS VIEW - Full width */
          agent && <AgentTasksView agent={agent} user={user} />
        ) : viewMode === 'settings' ? (
          /* SETTINGS VIEW - Full width */
          agent && <AgentEditView agent={agent} user={user} />
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 !overflow-y-hidden"
            autoSaveId={`resizable-chat-layout-${agentId}`}
          >
            {/* DESKTOP-ONLY RESIZABLE SIDEBAR */}
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              collapsible
              collapsedSize={0}
              onCollapse={() => setIsSidebarCollapsed(true)}
              onExpand={() => setIsSidebarCollapsed(false)}
              className={cn(
                'hidden md:flex md:flex-col bg-accent border-r p-3 pr-0 transition-all duration-300 ease-in-out',
                'max-w-[320px]',
                isSidebarCollapsed && 'p-0 border-none',
              )}
            >
              {/* Render content only if not collapsed */}
              {!isSidebarCollapsed && <ChatSidebarContent />}
            </ResizablePanel>

            {/* Separator Handle - visible only on desktop */}
            <ResizableHandle
              withHandle
              className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
            />

            {/* MAIN CONTENT PANEL */}
            <ResizablePanel defaultSize={80} className="flex flex-col">
              {/* Ensure main takes full height within the panel */}
              <main className="bg-accent flex-1 overflow-auto flex flex-col">
                {!agent ? (
                  <div className="p-4 flex justify-center items-center gap-2 h-full w-full">
                    <LoadingIndicator className="w-10 h-10 text-primary" />
                  </div>
                ) : (
                  <Thread
                    components={{
                      //@ts-expect-error We're extending thread welcome hackishly with children
                      ThreadWelcome: MyThreadWelcome,
                      // @ts-expect-error We're extending composer hackishly with drag and drop
                      Composer: MyComposer,
                    }}
                    onAgentSelectorOpen={() => setIsAgentSelectorOpen(true)}
                    welcome={{
                      suggestions:
                        agent?.suggestions && agent?.suggestions.length > 0
                          ? agent?.suggestions.map(suggestion => ({
                              text: suggestion.label,
                              prompt: suggestion.prompt,
                            }))
                          : undefined,
                      message:
                        agent?.greeting ?? 'What do you want to create today?',
                    }}
                    assistantAvatar={{
                      src: getCloudfrontOriginalUrl(agent?.userImage),
                      fallback: agent?.name,
                      alt: agent?.name,
                    }}
                    assistantMessage={{
                      allowReload: false,
                      allowSpeak: false,
                      components: {
                        Empty: () => (
                          <div className="col-start-3 row-start-2">
                            <TypingIndicator />
                          </div>
                        ),
                        Text: MarkdownText,
                        ToolFallback,
                      },
                    }}
                    userMessage={{
                      allowEdit: false,
                    }}
                    branchPicker={{
                      allowBranchPicker: false,
                    }}
                    composer={{
                      allowAttachments: true,
                    }}
                    tools={[TaskResultTool]}
                    config={{
                      threadId,
                      defaultMessages: [],
                    }}
                  />
                )}
                {isError ? (
                  <div className="p-4">
                    <AlertDestructive title={'Error loading agent'}>
                      <AlertDescription>{error?.message}</AlertDescription>
                    </AlertDestructive>
                  </div>
                ) : null}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </MyRuntimeProvider>
  )
}

export default Chat
