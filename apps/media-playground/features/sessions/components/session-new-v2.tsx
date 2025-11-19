'use client'

import { MessageInput } from './message-input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useUserPreferencesQuery } from '@/hooks/query/use-user-preferences-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

const SessionNewV2 = () => {
  const router = useRouter()
  const { user, isSignedIn } = useAuthState()
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Get user preferences for last agent
  const { lastAgents } = useUserPreferencesQuery({ enabled: !!isSignedIn })
  const lastAgentId = lastAgents.length > 0 ? lastAgents[0]._id : undefined
  const defaultAgentUsername =
    lastAgents.length > 0 ? lastAgents[0].username : 'eve'

  // Get the agent (either last agent or default to eve)
  const { agent } = useAgentQuery({
    key: lastAgentId || 'eve',
  })

  // Get other recent agents (excluding the current one)
  const otherAgents = lastAgents.filter(a => a._id !== agent?._id).slice(0, 3)

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[], thinking?: boolean) => {
      if (!user || !agent) return

      setIsCreatingSession(true)

      try {
        const payload = {
          content,
          attachments,
          agent_ids: [agent._id],
          thinking,
        }
        const response = await fetch('/api/sessions/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const result = await response.json()
        if (result.session_id) {
          router.push(`/chat/${defaultAgentUsername}/${result.session_id}`)
        }
      } catch (error) {
        console.error('Error creating session:', error)
        setIsCreatingSession(false)
      }
    },
    [user, agent, defaultAgentUsername, router],
  )

  if (!agent || isCreatingSession) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full">
        <div className="aui-thread-welcome min-h-full flex items-center justify-center">
          <div className="aui-thread-welcome-center flex flex-col items-center justify-center min-h-full w-full">
            {/* Main content area with avatar and switch section */}
            <div className="flex items-start gap-8 mb-8">
              {/* Left side: Main agent */}
              <div className="relative flex flex-col items-center">
                <div className="absolute inset-0 rounded-full blur-3xl scale-150 opacity-60 animate-pulse" />
                <div className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 tracking-wide">
                  {agent.name}
                </div>

                {/* Main Avatar with Settings Icon */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setIsAgentSelectorOpen(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/10 rounded-full scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 relative z-10 ring-4 ring-primary/25 ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-primary/50 hover:scale-105">
                    <AvatarImage
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      src={getCloudfrontOriginalUrl(agent.userImage)}
                    />
                    <AvatarFallback className="w-24 h-24 md:w-32 md:h-32 text-xl md:text-2xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary border-2 border-primary/20">
                      {agent.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Settings Icon - Bottom Right Corner */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation()
                      setIsSettingsOpen(true)
                    }}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background border border-border hover:bg-muted z-20"
                    title="Agent Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right side: Switch to section */}
              {otherAgents.length > 0 && (
                <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="text-sm text-muted-foreground font-medium">
                    Switch to
                  </div>
                  <div className="flex flex-col gap-2">
                    {otherAgents.map(otherAgent => (
                      <Link
                        key={otherAgent._id}
                        href={`/chat/${otherAgent.username || otherAgent._id}`}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-background/80 transition-colors group"
                      >
                        <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-primary/50 transition-all">
                          <AvatarImage
                            src={
                              otherAgent.userImage
                                ? getCloudfrontOriginalUrl(otherAgent.userImage)
                                : undefined
                            }
                            alt={otherAgent.username || 'Agent'}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-muted text-xs font-medium">
                            {otherAgent.username?.slice(0, 2).toUpperCase() ||
                              'AG'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {otherAgent.username || 'Agent'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-4xl px-4 mb-6">
              <MessageInput
                sessionId={'new'}
                onStreamingMessage={handleSendMessage}
                enableLiveAudio={true}
                agent={agent}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Selector Modal */}
      <SingleAgentSelectorModal
        open={isAgentSelectorOpen}
        onOpenChange={setIsAgentSelectorOpen}
        onSelect={selectedAgent => {
          setIsAgentSelectorOpen(false)
          window.location.href = `/sessions/new2?agent=${selectedAgent.username}`
        }}
      />

      {/* Agent Settings Modal */}
      {agent && (
        <AgentSettingsModal
          agentId={agent.username || agent._id}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}
    </main>
  )
}

export default SessionNewV2
