'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface AgentContext {
  description: string
  persona: string
  memory: {
    userMemory: string
    collectiveMemory: Array<{ shard_name: string; content: string }>
  }
}

const RealtimeView: FC = () => {
  const params = useParams()
  const agentId = params?.agentId as string | undefined

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
  } = useAgentQuery({ key: agentId as string })

  const [agentContext, setAgentContext] = useState<AgentContext | null>(null)

  // Fetch agent context function
  const fetch_agent_context = async (): Promise<AgentContext> => {
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
      // Return empty memory on error
    }

    return {
      description,
      persona,
      memory,
    }
  }

  // Load agent context when agent is available
  useEffect(() => {
    const loadContext = async () => {
      if (agent) {
        const context = await fetch_agent_context()
        setAgentContext(context)
      }
    }
    loadContext()
  }, [agent])

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

  return (
    <main className="flex-1 overflow-hidden flex flex-col bg-background">
      <div className="flex-1 flex flex-col p-8">
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

        {/* Agent Context Debug Box */}
        {agentContext && (
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold mb-2">Description:</h3>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {agentContext.description || '(empty)'}
              </pre>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold mb-2">Persona:</h3>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {agentContext.persona || '(empty)'}
              </pre>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold mb-2">User Memory:</h3>
              <pre className="text-xs whitespace-pre-wrap break-words">
                {agentContext.memory.userMemory || '(empty)'}
              </pre>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold mb-2">
                Collective Memory ({agentContext.memory.collectiveMemory.length}{' '}
                shards):
              </h3>
              {agentContext.memory.collectiveMemory.length === 0 ? (
                <pre className="text-xs">(empty)</pre>
              ) : (
                <div className="space-y-2">
                  {agentContext.memory.collectiveMemory.map((shard, index) => (
                    <div key={index} className="border-l-2 border-primary pl-3">
                      <div className="text-xs font-semibold text-primary mb-1">
                        {shard.shard_name}
                      </div>
                      <pre className="text-xs whitespace-pre-wrap break-words">
                        {shard.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default RealtimeView
