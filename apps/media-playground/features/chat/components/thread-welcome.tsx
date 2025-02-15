'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  ThreadPrimitive,
  ThreadWelcome,
  useThreadConfig,
} from '@assistant-ui/react'
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
  // console.log({ avatar, thumb: getCloudfrontUrl(avatar.src, 1024), src: getCloudfrontOriginalUrl(avatar.src) })
  return (
    <>
      <div className="text-sm text-muted-foreground mb-2">
        {avatar.fallback}
      </div>
      <Avatar className="w-16 h-16 md:w-24 md:h-24 col-start-1 row-span-full row-start-1">
        <AvatarImage
          className={'object-cover'}
          src={getCloudfrontOriginalUrl(avatar.src)}
        />
        <AvatarFallback delayMs={250} className="w-16 h-16 md:w-24 md:h-24">
          {avatar.fallback}
        </AvatarFallback>
      </Avatar>
    </>
  )
}

const MyThreadWelcomeSuggestion: FC<{
  suggestion: { text: ReactNode; prompt: string }
}> = ({ suggestion: { text, prompt } }) => {
  return (
    <ThreadPrimitive.Suggestion prompt={prompt} method="replace" autoSend>
      <Button variant="outline" className="px-3 py-2 rounded-full">
        {text ?? prompt}
      </Button>
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
            className={`suggestion-item flex-shrink-0 transition-opacity duration-200 ${
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
