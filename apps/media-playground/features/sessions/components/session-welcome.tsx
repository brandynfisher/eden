import { MessageInput } from './message-input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import {
  /*PlusIcon,*/
  RotateCcwIcon,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

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
  // Move all hooks to the top
  const [showAll /*setShowAll*/] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [, /*visibleCount*/ setVisibleCount] = useState(
    props.variant === 'chat' ? (props.agent?.suggestions || []).length : 0,
  )

  const measureAndUpdate = useCallback(() => {
    if (props.variant !== 'chat') return
    const container = containerRef.current
    if (!container) return

    const welcomeCenter = container.closest('.aui-thread-welcome-center')
    if (!welcomeCenter) return

    const containerWidth = welcomeCenter.clientWidth - 86
    const items = Array.from(container.querySelectorAll('.suggestion-item'))

    let totalWidth = 0
    let count = items.length

    for (let i = 0; i < items.length; i++) {
      const itemWidth = items[i].getBoundingClientRect().width + 8
      if (totalWidth + itemWidth > containerWidth) {
        count = Math.max(1, i)
        break
      }
      totalWidth += itemWidth
    }

    setVisibleCount(count)
  }, [props.variant])

  useEffect(() => {
    if (props.variant !== 'chat') return
    const container = containerRef.current
    if (!container) return
    const welcomeCenter = container.closest('.aui-thread-welcome-center')
    if (!welcomeCenter) return

    const resizeObserver = new ResizeObserver(() => {
      if (!showAll) measureAndUpdate()
    })

    resizeObserver.observe(welcomeCenter)
    measureAndUpdate()
    return () => resizeObserver.disconnect()
  }, [showAll, props.variant, measureAndUpdate])

  // Handle different variants
  const onAgentSelectorOpen =
    'onAgentSelectorOpen' in props ? props.onAgentSelectorOpen : undefined

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
  const { agent, isLoading, onSendMessage } = props
  const suggestions = agent?.suggestions || []

  return (
    <div className="aui-thread-welcome min-h-full flex items-center justify-center">
      <div className="aui-thread-welcome-center flex flex-col items-center justify-center min-h-full">
        <div className="relative flex flex-col items-center p-2 ">
          <div className="absolute inset-0 rounded-full blur-3xl scale-150 opacity-60 animate-pulse" />
          <div className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 tracking-wide">
            {agent.name}
          </div>
          <div className="relative group mb-4">
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
          <p className="text-2xl font-light">
            {agent.greeting || 'What do you want to create today?'}
          </p>
        </div>

        <div className="w-full max-w-[--aui-thread-max-width] mx-auto mb-6">
          <MessageInput
            sessionId={'new'}
            onStreamingMessage={onSendMessage}
            enableLiveAudio={true}
            agent={agent}
          />
        </div>

        <div className=" w-full flex flex-wrap gap-3 justify-center mb-3">
          {suggestions.length > 0 && (
            <div className="w-full  mx-auto relative" ref={containerRef}>
              <div
                className={`gap-3 flex flex-row gap-2 flex-wrap justify-center transition-[height,opacity] duration-200`}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    className="suggestion-item hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4 flex-shrink-0 border border-border rounded-full bg-gradient-to-br from-card to-muted/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                    key={`${suggestion.prompt}-${index}`}
                  >
                    <button
                      className="px-4 py-2.5 rounded-full text-sm"
                      onClick={() => onSendMessage(suggestion.label)}
                      disabled={isLoading}
                    >
                      {suggestion.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {onAgentSelectorOpen && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={onAgentSelectorOpen}
              className="group relative bg-gradient-to-r from-card to-muted/60 border-border hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10"
            >
              <RotateCcwIcon className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-180" />
              Chat with another agent
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionWelcome
