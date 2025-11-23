import { MessageInput } from './message-input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AgentSettingsModal } from '@/features/agent/agent-settings-modal'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { Settings } from 'lucide-react'
import React, { useState } from 'react'

type Variant = 'chat' | 'session'

interface BaseProps {
  variant: Variant
}

interface ChatVariantProps extends BaseProps {
  variant: 'chat'
  agent: Agent
  isLoading: boolean
  onSendMessage: (
    content: string,
    attachments?: string[],
    thinking?: boolean,
  ) => void
  onAgentSelectorOpen?: () => void
}

interface SessionVariantProps extends BaseProps {
  variant: 'session'
  agents: Agent[]
  sessionTitle?: string
}

type SessionWelcomeProps = ChatVariantProps | SessionVariantProps

const SessionWelcome: React.FC<SessionWelcomeProps> = props => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { user } = useAuthState()

  // Handle different variants
  const onAgentSelectorOpen =
    'onAgentSelectorOpen' in props ? props.onAgentSelectorOpen : undefined

  // Get agent permissions for chat variant
  const currentAgent = props.variant === 'chat' ? props.agent : undefined
  const { hasEditAccess } = useAgentPermissions(currentAgent, user?._id)

  if (props.variant === 'session') {
    const { agents, sessionTitle } = props
    return (
      <div className="flex flex-col items-center justify-center py-16 h-full flex-1">
        <div className="flex -space-x-6 mb-6">
          {agents.slice(0, 8).map((agent, idx) => (
            <Avatar
              key={agent._id}
              className="h-20 w-20 border-4 border-background shadow-lg relative z-10"
              style={{ zIndex: agents.length - idx }}
            >
              <AvatarImage
                src={getCloudfrontOriginalUrl(agent.userImage)}
                alt={agent.name}
                className="object-cover"
              />
              <AvatarFallback className="text-lg">
                {agent.name?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="text-muted-foreground text-xl text-center">
          {sessionTitle || 'Untitled session'}
        </div>
      </div>
    )
  }

  // Chat variant logic
  const { agent, onSendMessage } = props

  return (
    <div className="aui-thread-welcome min-h-full flex items-center justify-center">
      <div className="aui-thread-welcome-center flex flex-col items-center justify-center min-h-full w-full max-w-7xl">
        <div className="relative flex flex-col items-center p-2 ">
          <div className="absolute inset-0 rounded-full blur-3xl scale-150 opacity-60 animate-pulse pointer-events-none" />
          <div className="flex items-center gap-2 mb-4 md:mb-6 relative z-10">
            <div className="text-lg md:text-xl font-semibold text-foreground tracking-wide">
              {agent.name}
            </div>
            {hasEditAccess && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-8 w-8 rounded-full hover:bg-muted/20"
                title="Agent Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div
            className="relative group mb-4 cursor-pointer"
            onClick={onAgentSelectorOpen}
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
          </div>
        </div>

        <div className="mb-8">
          <p className="text-2xl font-light text-center">
            {agent.greeting || 'What do you want to create today?'}
          </p>
        </div>

        <div className="w-full max-w-4xl px-4 mb-6">
          <MessageInput
            sessionId={'new'}
            onStreamingMessage={onSendMessage}
            enableLiveAudio={true}
            agent={agent}
          />
        </div>
      </div>

      {/* Agent Settings Modal */}
      {agent && (
        <AgentSettingsModal
          agentId={agent.username || agent._id}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}
    </div>
  )
}

export default SessionWelcome
