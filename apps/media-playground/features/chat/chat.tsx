'use client'

import AgentLink from '../agent/agent-link'
import { useEdenRuntimeExtras } from './hooks/useEdenRuntime'
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { MyComposer } from '@/features/chat/components/composer'
import Thread from '@/features/chat/components/thread'
import MyThreadWelcome from '@/features/chat/components/thread-welcome'
import { TaskResultTool } from '@/features/chat/components/tools/task-result-tool'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { EdenRuntimeProvider } from '@/features/chat/providers/eden-runtime-provider'
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
  ChevronRightIcon,
  EditIcon,
  MoreHorizontal,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react'
import { FC, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const TopLeft: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const isNewSelected = useThreadListItem(t => t.id === 'DEFAULT_THREAD_ID')
  const isLoading = false

  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="ghost"
        onClick={onItemClick}
        className={cn(
          'flex w-full justify-between px-3 mb-1',
          !isLoading && isNewSelected && 'bg-aui-muted',
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

const ThreadListItemTrigger: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  const id = useThreadListItem(t => t.id)
  const agentId = useEdenRuntimeExtras(extras => extras.agentId)
  const { invalidate } = useThreadListQuery({ agentId })
  const runtime = useAssistantRuntime()

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

  return (
    <ThreadListItemPrimitive.Trigger
      className="relative flex group items-center justify-between flex-grow w-full gap-1 hover:bg-muted/50 rounded-lg transition-all"
      onClick={onItemClick}
    >
      <div className="overflow-hidden whitespace-nowrap text-ellipsis px-3 py-2">
        <ThreadListItemPrimitive.Title fallback="Untitled" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className="shrink-0 h-5 w-5 mr-1 hidden [&[data-state=open]]:flex group-hover:flex [@media(pointer:coarse)]:flex"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="[&[data-state=closed]]:hidden">
          <DropdownMenuItem
            className="flex items-center gap-2 text-destructive hover:!text-destructive"
            onClick={() => deleteThread(id)}
          >
            <TrashIcon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ThreadListItemPrimitive.Trigger>
  )
}

const ThreadListItem: FC<{
  onItemClick?: () => void
}> = ({ onItemClick }) => {
  return (
    <ThreadListItemPrimitive.Root className="group flex justify-between hover:text-primary data-[active]:bg-muted data-[active]:text-primary font-normal data-[active]:font-medium hover:bg-muted/50 items-center gap-2 rounded-lg transition-all mr-3">
      <ThreadListItemTrigger onItemClick={onItemClick} />
    </ThreadListItemPrimitive.Root>
  )
}

const MainLeft: FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const { isSignedIn, verifyAuth } = useAuthState()
  const agentId = useEdenRuntimeExtras(extras => extras.agentId)
  const { isLoading, hasMore, isFetchingNextPage } = useThreadListQuery({
    agentId,
    enabled: !!isSignedIn && !!agentId,
  })

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
                <div id="thread-list-observer-target" className="h-8 w-full">
                  <Separator orientation="horizontal" className="my-2" />
                  <div className="flex justify-center text-muted-foreground text-sm py-2">
                    Older Threads
                  </div>
                  <Separator orientation="horizontal" className="my-2" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                      <Skeleton className="w-full h-9" />
                    </div>
                  )}
                </div>
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
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
  onItemClick?: () => void
}> = ({ agent, isOwner, handleEditClick, onItemClick }) => {
  return (
    <>
      <div className="flex items-center justify-between gap-2 ml-2">
        {agent ? (
          <>
            <AgentLink
              agent={agent}
              className={cn(
                isOwner ? 'max-w-[calc(100%-2.5rem)]' : 'max-w-full',
              )}
            />
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 size-8"
                onClick={handleEditClick}
              >
                <SettingsIcon className="size-4" />
              </Button>
            )}
          </>
        ) : (
          <Skeleton className="w-[120px] h-8" />
        )}
      </div>
      <Separator orientation="horizontal" className="my-2 mb-1" />
      <div className="border-b mb-2">
        <TopLeft onItemClick={onItemClick} />
      </div>
      <MainLeft onItemClick={onItemClick} />
    </>
  )
}

const LeftBarSheet: FC<{
  // Updated to accept props needed by ChatSidebarContent
  agent: Agent | null | undefined
  isOwner: boolean
  handleEditClick: () => void
}> = ({ agent, isOwner, handleEditClick }) => {
  const [open, setOpen] = useState(false)
  const handleCloseSheet = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 md:hidden gap-1"
        >
          <ChevronRightIcon className={'size-4'} />
          View Threads
          <span className="sr-only">Toggle thread list menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex flex-col max-h-full pt-10 px-3 bg-[#0e1421] border-r gap-0"
      >
        <SheetTitle className="sr-only">Thread List</SheetTitle>
        {/* Use extracted content here */}
        <ChatSidebarContent
          agent={agent}
          isOwner={isOwner}
          handleEditClick={handleEditClick}
          onItemClick={handleCloseSheet}
        />
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

  const isOwner = useMemo(() => {
    return user?._id === agent?.owner._id
  }, [user, agent])

  if (!isMounted) {
    return null
  }

  return (
    <EdenRuntimeProvider agentId={agentId} threadId={threadId}>
      <div
        className="
         flex flex-col
         fixed
         inset-x-0
         bottom-0
         top-16
       "
      >
        {/* MOBILE-ONLY HEADER */}
        <div className="bg-[#0e1421]  border-b px-2 py-2 md:hidden flex items-center justify-between">
          <LeftBarSheet
            agent={agent}
            isOwner={isOwner}
            handleEditClick={handleEditClick}
          />
          <div className="ml-auto flex items-center gap-2">
            {agent ? (
              <>
                <AgentLink
                  agent={agent}
                  className={`max-w-[120px] xs:max-w-[300px]`}
                />
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-8"
                    onClick={handleEditClick}
                  >
                    <SettingsIcon className="size-4" />
                  </Button>
                )}
              </>
            ) : (
              <Skeleton className="w-[120px] h-8" />
            )}
          </div>
        </div>
        {/* RESIZABLE LAYOUT FOR DESKTOP / MAIN CONTENT AREA */}
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 !overflow-y-hidden" // Take remaining height, prevent group overflow
          autoSaveId={`resizable-chat-layout-${agentId}`}
        >
          {/* DESKTOP-ONLY RESIZABLE SIDEBAR */}
          <ResizablePanel
            defaultSize={25}
            minSize={10}
            maxSize={35}
            collapsible
            collapsedSize={0} // Fully collapse
            onCollapse={() => setIsSidebarCollapsed(true)}
            onExpand={() => setIsSidebarCollapsed(false)}
            className={cn(
              'hidden md:flex md:flex-col bg-[#0e1421] border-r p-3 pr-0 transition-all duration-300 ease-in-out',
              isSidebarCollapsed && 'p-0 border-none',
            )}
          >
            {/* Render content only if not collapsed */}
            {!isSidebarCollapsed && (
              <ChatSidebarContent
                agent={agent}
                isOwner={isOwner}
                handleEditClick={handleEditClick}
              />
            )}
          </ResizablePanel>

          {/* Separator Handle - visible only on desktop */}
          <ResizableHandle
            withHandle
            className="hidden md:flex w-2 bg-transparent [&>div]:border-l [&>div]:border-border [&>div]:hover:border-primary [&>div]:transition-colors relative"
          />

          {/* MAIN CONTENT PANEL */}
          <ResizablePanel defaultSize={82} className="flex flex-col">
            {/* Ensure main takes full height within the panel */}
            <main className="bg-accent flex-1 overflow-auto flex flex-col">
              {!agent ? (
                <div className="p-4 flex justify-center items-center gap-2 h-full w-full">
                  <LoadingIndicator className="w-10 h-10 text-purple-600" />
                </div>
              ) : (
                <Thread
                  components={{
                    //@ts-expect-error We're extending thread welcome hackishly with children
                    ThreadWelcome: MyThreadWelcome,
                    // @ts-expect-error We're extending composer hackishly with drag and drop
                    Composer: MyComposer,
                  }}
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
                      Empty: () => <div></div>,
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
      </div>
    </EdenRuntimeProvider>
  )
}

export default Chat
