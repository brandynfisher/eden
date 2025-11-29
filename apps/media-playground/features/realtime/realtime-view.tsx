'use client'

import AnimatedBackground from './components/animated-background'
import AudioReactiveAvatar from './components/audio-reactive-avatar'
import ConversationInterface from './conversation-interface'
import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentRealtimeSettings } from '@/hooks/query/use-agent-realtime-settings'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { AgentContext } from '@/lib/voice/build-dynamic-variables'
import axios from 'axios'
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

  // Fetch realtime settings for this agent (falls back to defaults if none exist)
  // Note: Must use agent._id (MongoDB ObjectId), not agentId (username from URL)
  const { settings: realtimeSettings } = useAgentRealtimeSettings({
    agentId: agent?._id as string,
    enabled: !!agent?._id,
  })

  const [agentContext, setAgentContext] = useState<AgentContext | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [connectionStatus, setConnectionStatus] =
    useState<string>('disconnected')

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
      <main className="fixed inset-0 bg-background">
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Single vertical container from 5% top to 5% bottom */}
        <div className="absolute top-[5%] bottom-[5%] left-1/2 -translate-x-1/2 w-full flex flex-col items-center z-10">
          {/* Agent Avatar and Name */}
          <div
            className={cn(
              'flex flex-col items-center gap-4 flex-shrink-0 transition-all duration-500',
              connectionStatus === 'connected' ? 'mt-[8%]' : 'mt-[3%]',
            )}
          >
            {/* Audio-Reactive Agent Avatar */}
            <AudioReactiveAvatar
              imageSrc={getCloudfrontOriginalUrl(agent?.userImage)}
              name={agent?.name || 'Agent'}
              className={cn(
                'transition-all duration-500',
                connectionStatus === 'connected'
                  ? 'w-[clamp(12rem,25vw,16rem)] h-[clamp(12rem,25vw,16rem)]'
                  : 'w-[clamp(10rem,20vw,12rem)] h-[clamp(10rem,20vw,12rem)]',
              )}
              isSpeaking={isSpeaking}
            />

            {/* Agent Name with smooth glow effect when speaking */}
            <h1
              className={cn(
                'font-bold transition-all duration-500',
                connectionStatus === 'connected'
                  ? 'text-[clamp(1.875rem,5vw,2.5rem)]'
                  : 'text-[clamp(1.5rem,4vw,2rem)]',
                isSpeaking ? 'text-foreground' : 'text-foreground/80',
              )}
              style={
                isSpeaking
                  ? {
                      animation: 'smoothGlow 3s ease-in-out infinite',
                    }
                  : undefined
              }
            >
              {agent?.name}
            </h1>
            <style jsx>{`
              @keyframes smoothGlow {
                0%,
                100% {
                  filter: drop-shadow(0 0 12px hsl(var(--primary) / 0.5));
                }
                50% {
                  filter: drop-shadow(0 0 24px hsl(var(--primary) / 1));
                }
              }
            `}</style>
          </div>

          {/* Conversation Interface */}
          {agentContext && agent && (
            <ConversationInterface
              agentName={agent.name}
              agentContext={agentContext}
              edenAgentId={agent._id}
              realtimeSettings={realtimeSettings}
              isDevMode={false}
              onSpeakingChange={setIsSpeaking}
              onStatusChange={setConnectionStatus}
            />
          )}
        </div>
      </main>
    )
  }

  // Dev mode UI - app shell provides the sidebar
  return (
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
            realtimeSettings={realtimeSettings}
            isDevMode={true}
            onSpeakingChange={setIsSpeaking}
            onStatusChange={setConnectionStatus}
          />
        )}
      </div>
    </div>
  )
}

export default RealtimeView
