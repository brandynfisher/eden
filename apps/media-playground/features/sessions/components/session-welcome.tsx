import { MessageInput } from './message-input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { PlusIcon } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Variant = 'chat' | 'session'

interface BaseProps {
  variant: Variant
}

interface ChatVariantProps extends BaseProps {
  variant: 'chat'
  agent: Agent
  isLoading: boolean
  onSendMessage: (content: string, attachments?: string[]) => void
}

interface SessionVariantProps extends BaseProps {
  variant: 'session'
  agents: Agent[]
  sessionTitle?: string
}

type SessionWelcomeProps = ChatVariantProps | SessionVariantProps

const SessionWelcome: React.FC<SessionWelcomeProps> = props => {
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

  const { agent, isLoading, onSendMessage } = props
  const suggestions = agent?.suggestions || []
  const [showAll, setShowAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(suggestions.length)

  const measureAndUpdate = useCallback(() => {
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
  }, [])

  useEffect(() => {
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
  }, [showAll, suggestions.length, measureAndUpdate])

  return (
    <div className="aui-thread-welcome">
      <div className="aui-thread-welcome-center relative flex flex-col items-center justify-center min-h-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-col items-center p-2 mt-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl scale-150 opacity-60 animate-pulse" />
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
          <p className=" text-center">
            {agent.greeting || 'What do you want to create today?'}
          </p>
        </div>

        <div className="w-full max-w-[--aui-thread-max-width] mx-auto mb-6">
          <MessageInput sessionId={'new'} onStreamingMessage={onSendMessage} />
        </div>

        {suggestions.length > 0 && (
          <div
            className="w-full max-w-[--aui-thread-max-width] mx-auto relative"
            ref={containerRef}
          >
            <div
              className={`flex flex-row gap-2 flex-wrap justify-center transition-[height,opacity] duration-200 ${
                !showAll ? 'overflow-hidden pr-[84px]' : 'flex-wrap'
              }`}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.label}-${index}`}
                  className={`text-sm suggestion-item hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 transition-opacity duration-200 ${
                    !showAll && index >= visibleCount
                      ? 'opacity-0 absolute pointer-events-none'
                      : 'opacity-100'
                  }`}
                >
                  <button
                    className="px-3 py-2 rounded-full"
                    onClick={() => onSendMessage(suggestion.label)}
                    disabled={isLoading}
                  >
                    {suggestion.label}
                  </button>
                </div>
              ))}
            </div>
            {suggestions.length > visibleCount && !showAll && (
              <Button
                variant="outline"
                size="sm"
                className="absolute text-xs bg-muted/30 right-0 top-1/2 -translate-y-1/2 z-10 rounded-full"
                onClick={() => setShowAll(true)}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                More
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionWelcome
