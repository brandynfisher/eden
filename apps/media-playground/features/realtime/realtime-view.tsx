'use client'

import AnimatedBackground from './components/animated-background'
import AudioReactiveAvatar from './components/audio-reactive-avatar'
import ConversationInterface from './conversation-interface'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SessionsSidebarContent } from '@/features/sessions/components/sessions-sidebar'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { AgentContext } from '@/lib/voice/build-agent-prompt'
import axios from 'axios'
import { MenuIcon } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import { FC, useCallback, useEffect, useState } from 'react'

const RealtimeView: FC = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = params?.agentId as string | undefined
  const isDevMode = searchParams.get('dev') === 'true'

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
  } = useAgentQuery({ key: agentId as string })

  const [agentContext, setAgentContext] = useState<AgentContext | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Fetch agent context function
  const fetch_agent_context = useCallback(async (): Promise<AgentContext> => {
    if (!agent) {
      return {
        description: '',
        persona: '',
        memory: {
          userMemory: '',
          collectiveMemory: [],
        },
      }
    }

    // Fetch description and persona from agent object
    const description = agent.description || ''
    const persona = agent.persona || ''

    // Fetch memory context from API
    let memory = {
      userMemory: '',
      collectiveMemory: [] as Array<{ shard_name: string; content: string }>,
    }

    try {
      const response = await axios.get(
        `/api/agents/${agent._id}/memory-context`,
      )
      memory = {
        userMemory: response.data.userMemory || '',
        collectiveMemory: response.data.collectiveMemory || [],
      }
    } catch (error) {
      console.error('Failed to fetch agent memory context:', error)
      // Return empty memory on error
    }

    return {
      description,
      persona,
      memory,
    }
  }, [agent])

  // Load agent context when agent is available
  useEffect(() => {
    const loadContext = async () => {
      if (agent) {
        const context = await fetch_agent_context()
        setAgentContext(context)
      }
    }
    loadContext()
  }, [agent, fetch_agent_context])

  // Show loading if we're waiting for agent data
  if (!agent && !agentError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <LoadingIndicator className="w-10 h-10 text-purple-600" />
        </div>
      </main>
    )
  }

  // Show agent error
  if (agentError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4">
          <AlertDestructive title="Error loading agent">
            <AlertDescription>{agentErrorDetails?.message}</AlertDescription>
          </AlertDestructive>
        </div>
      </main>
    )
  }

  // Minimal full-screen UI for production mode
  if (!isDevMode) {
    return (
      <main className="fixed inset-0 bg-background flex items-center justify-center">
        {/* Animated Background */}
        <AnimatedBackground />

        <div className="flex flex-col items-center gap-8 relative z-10">
          {/* Audio-Reactive Agent Avatar */}
          <AudioReactiveAvatar
            imageSrc={getCloudfrontOriginalUrl(agent?.userImage)}
            name={agent?.name || 'Agent'}
            className="w-40 h-40"
          />

          {/* Agent Name */}
          <h1 className="text-3xl font-bold text-foreground">{agent?.name}</h1>

          {/* Conversation Interface - Minimal Mode */}
          {agentContext && agent && (
            <ConversationInterface
              agentName={agent.name}
              agentContext={agentContext}
              edenAgentId={agent._id}
              isDevMode={false}
            />
          )}
        </div>
      </main>
    )
  }

  // Dev mode UI with sidebar
  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={() => setIsSheetOpen(true)}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">{agent?.name || 'Realtime'}</h1>
      </div>

      <div className="flex flex-col fixed inset-x-0 bottom-0 top-12 md:top-0">
        {/* MOBILE LEFT BAR SHEET */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent
            side="left"
            className="flex flex-col max-h-full pt-0 pl-0 pr-0 pb-0 bg-accent border-r gap-0 [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {/* Mobile sticky header with logo and new chat button */}
            <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setIsSheetOpen(false)
                }}
                className="flex items-center gap-2"
              >
                <span className="text-lg font-semibold">Sessions</span>
              </button>
            </div>
            {/* Scrollable sidebar content */}
            <div className="flex-1 overflow-y-auto pl-3">
              <SessionsSidebarContent
                onItemClick={() => setIsSheetOpen(false)}
                isChat={false}
                isMobileSidebar={true}
              />
            </div>
          </SheetContent>
        </Sheet>

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
                isChat={false}
              />
            ) : (
              <SessionsSidebarContent
                onSidebarToggle={() => setIsSidebarCollapsed(true)}
                isChat={false}
              />
            )}
          </ResizablePanel>

          {/* Separator Handle */}
          <ResizableHandle className="hidden md:flex w-2 bg-transparent" />

          {/* MAIN CONTENT PANEL */}
          <ResizablePanel
            defaultSize={80}
            className="relative flex flex-col bg-background -ml-px"
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                {/* Agent Profile Icon */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex flex-col items-center">
                    <div className="relative group mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/10 rounded-full scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                      <Avatar className="w-32 h-32 relative z-10 ring-4 ring-primary/25 ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-primary/50 hover:scale-105">
                        <AvatarImage
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          src={getCloudfrontOriginalUrl(agent?.userImage)}
                          alt={agent?.name}
                        />
                        <AvatarFallback className="w-32 h-32 text-2xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary border-2 border-primary/20">
                          {agent?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-xl font-semibold text-foreground mb-2">
                      {agent?.name}
                    </div>
                    {agentContext && (
                      <div className="text-sm text-muted-foreground text-center max-w-md">
                        {agentContext.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Conversation Interface */}
                {agentContext && agent && (
                  <ConversationInterface
                    agentName={agent.name}
                    agentContext={agentContext}
                    edenAgentId={agent._id}
                    isDevMode={true}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}

export default RealtimeView
