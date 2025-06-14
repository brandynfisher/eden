'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { ThreadPrimitive } from '@assistant-ui/react'
import { ThreadWelcome, useThreadConfig } from '@assistant-ui/react-ui'
import { PlusIcon } from 'lucide-react'
import React, {
  FC,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const MyThreadWelcomeAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()

  return (
    <div className="relative flex flex-col items-center">
      {/* Subtle glow effect behind avatar */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl scale-150 opacity-60 animate-pulse"></div>

      {/* Agent name with elegant typography */}
      <div className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 tracking-wide">
        {avatar.fallback}
      </div>

      {/* Large, prominent avatar with beautiful border */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/10 rounded-full scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
        <Avatar className="w-24 h-24 md:w-32 md:h-32 relative z-10 ring-4 ring-primary/25 ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-primary/50 hover:scale-105">
          <AvatarImage
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            src={getCloudfrontOriginalUrl(avatar.src)}
          />
          <AvatarFallback
            delayMs={250}
            className="w-24 h-24 md:w-32 md:h-32 text-xl md:text-2xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary border-2 border-primary/20"
          >
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

const MyThreadWelcomeSuggestion: FC<{
  suggestion: { text: ReactNode; prompt: string }
}> = ({ suggestion: { text, prompt } }) => {
  return (
    <ThreadPrimitive.Suggestion prompt={prompt} method="replace" autoSend>
      <div className="px-3 py-2 rounded-full">{text ?? prompt}</div>
    </ThreadPrimitive.Suggestion>
  )
}

const MyThreadWelcomeSuggestions: FC = () => {
  const { welcome } = useThreadConfig()
  const [showAll, setShowAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const suggestions = useMemo(
    () => welcome?.suggestions ?? [],
    [welcome?.suggestions],
  )
  const [visibleCount, setVisibleCount] = useState(suggestions.length)

  const measureAndUpdate = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    // Get the ThreadWelcome.Center parent
    const welcomeCenter = container.closest('.aui-thread-welcome-center')
    if (!welcomeCenter) return

    const containerWidth = welcomeCenter.clientWidth - 86 // Account for button width
    const items = Array.from(container.querySelectorAll('.suggestion-item'))

    let totalWidth = 0
    let count = items.length

    for (let i = 0; i < items.length; i++) {
      const itemWidth = items[i].getBoundingClientRect().width + 8 // Gap
      if (totalWidth + itemWidth > containerWidth) {
        count = Math.max(1, i)
        break
      }
      totalWidth += itemWidth
    }

    setVisibleCount(count)
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const welcomeCenter = container.closest('.aui-thread-welcome-center')
    if (!welcomeCenter) return

    const resizeObserver = new ResizeObserver(() => {
      if (!showAll) {
        measureAndUpdate()
      }
    })

    resizeObserver.observe(welcomeCenter)
    measureAndUpdate()

    return () => resizeObserver.disconnect()
  }, [showAll, suggestions.length, measureAndUpdate])

  return (
    <div className="w-full relative" ref={containerRef}>
      <div
        className={`flex flex-row gap-2 transition-[height,opacity] duration-200 ${
          !showAll ? 'overflow-hidden pr-[84px]' : 'flex-wrap'
        }`}
      >
        {suggestions.map((suggestion, index) => (
          <div
            className={`text-sm suggestion-item hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 transition-opacity duration-200 ${
              !showAll && index >= visibleCount
                ? 'opacity-0 absolute pointer-events-none'
                : 'opacity-100'
            }`}
            key={`${suggestion.prompt}-${index}`}
          >
            <MyThreadWelcomeSuggestion
              suggestion={{ text: suggestion.text, prompt: suggestion.prompt }}
            />
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
  )
}

const MyThreadWelcome: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThreadWelcome.Root>
      <ThreadWelcome.Center className="relative">
        <MyThreadWelcomeAvatar />
        <ThreadWelcome.Message className="mb-8" />
        {children}
        <AuthClickGuard className="mt-6">
          <MyThreadWelcomeSuggestions />
        </AuthClickGuard>
      </ThreadWelcome.Center>
    </ThreadWelcome.Root>
  )
}

export default MyThreadWelcome
