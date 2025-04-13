'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { LightboxGallery } from '@/components/media/lightbox'
import { Button } from '@/components/ui/button'
import MyAssistantMessage from '@/features/chat/components/assistant-message'
import {
  ComposerAttachmentDropzone,
  MyComposer,
} from '@/features/chat/components/composer'
import MyEditComposer from '@/features/chat/components/edit-composer'
import MyUserMessage from '@/features/chat/components/user-message'
import { useAuthState } from '@/hooks/use-auth-state'
import { ReadyState } from '@/hooks/use-shared-websocket-worker'
import { useWebSocketContext } from '@/providers/websocket-provider'
import {
  ThreadPrimitive,
  useComposerRuntime,
  useThread,
} from '@assistant-ui/react'
import { Thread, ThreadConfig, ThreadWelcome } from '@assistant-ui/react-ui'
import { ArrowDownIcon } from '@radix-ui/react-icons'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'

const ThreadFollowupSuggestions: FC = () => {
  const suggestions = useThread(t => t.suggestions)

  return (
    <ThreadPrimitive.If empty={false} running={false}>
      {suggestions && suggestions.length ? (
        <div className="aui-thread-followup-suggestions">
          {suggestions?.map((suggestion, idx) => (
            <ThreadPrimitive.Suggestion
              key={idx}
              className="aui-thread-followup-suggestion"
              prompt={suggestion.prompt}
              method="replace"
              autoSend
            >
              {suggestion.prompt}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      ) : null}
    </ThreadPrimitive.If>
  )
}

type ThreadConfigWithExtras = ThreadConfig & {
  connectionLost?: boolean
  threadId?: string
}

const MyThread: FC<ThreadConfigWithExtras> = config => {
  const {
    components: {
      Composer: ComposerComponent = MyComposer,
      ThreadWelcome: ThreadWelcomeComponent = ThreadWelcome,
    } = {},
    threadId,
  } = config

  const [isMounted, setIsMounted] = useState(false)
  const { readyState, isAttemptingReconnect } = useWebSocketContext()
  const { isSignedIn } = useAuthState()
  const [isDragging, setIsDragging] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const initialConnectionAttemptRef = useRef(true)
  const composerRuntime = useComposerRuntime()
  const accept = composerRuntime?.getAttachmentAccept()
  const viewportRef = useRef<HTMLDivElement>(null)
  const messages = useThread(t => t.messages)
  const isInitialLoadRef = useRef(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastSeenContentRef = useRef('')
  const lastMessagesLengthRef = useRef(messages.length)

  // Constants for scroll calculations
  const BOTTOM_THRESHOLD = 20 // How close to bottom to consider "at bottom"

  // Get a string representation of all complete assistant messages
  const assistantMessagesContent = messages
    .filter(m => m.role === 'assistant' && m.content && m.content.length > 0)
    .map(m => m.content)
    .join('')

  // Get a string representation of all assistant messages (including empty/generating ones)
  const allAssistantMessages = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content || '')
    .join('')

  // Check if any messages are still being generated
  const hasGeneratingMessage = messages.some(
    m => m.role === 'assistant' && (!m.content || m.content.length === 0),
  )

  // Get the threadId from the URL if available
  const urlThreadId =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)[2] // /chat/agentName/threadId
      : undefined
  const effectiveThreadId = threadId || urlThreadId
  const lastThreadIdRef = useRef<string | undefined>(effectiveThreadId)

  // Show welcome screen when no threadId is present
  const showWelcomeScreen = !effectiveThreadId

  // Only show loading when:
  // 1. Component is mounted (to avoid double loading states with parent)
  // 2. We have a threadId but no messages yet
  const showLoadingState = !showWelcomeScreen
    ? false
    : isMounted && Boolean(effectiveThreadId) && messages.length === 0

  // Mount effect - only run once
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Delay setting isMounted slightly to avoid flash of loading state
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Reset new messages state when switching threads
  useEffect(() => {
    if (effectiveThreadId !== lastThreadIdRef.current) {
      setHasNewMessages(false)
      setIsAtBottom(true)
      isInitialLoadRef.current = true
      lastSeenContentRef.current = ''
      lastThreadIdRef.current = effectiveThreadId
    }
  }, [effectiveThreadId])

  // Track scroll position and new messages
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = viewport

      // Calculate distance from bottom correctly
      const distanceFromBottom = Math.abs(
        scrollHeight - scrollTop - clientHeight,
      )

      // Consider "at bottom" if within the smaller threshold
      const atBottom = distanceFromBottom < BOTTOM_THRESHOLD

      // Consider "near bottom" if within one viewport height
      const nearBottom = distanceFromBottom < clientHeight

      setIsAtBottom(atBottom)
      setIsNearBottom(nearBottom)
      setIsScrolled(scrollTop > 100)

      if (atBottom && !hasGeneratingMessage) {
        setHasNewMessages(false)
        lastSeenContentRef.current = assistantMessagesContent
      }
    }

    viewport.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [assistantMessagesContent, hasGeneratingMessage])

  // Scroll to bottom helper with improved mobile support
  const scrollToBottom = useCallback(() => {
    if (!viewportRef.current) return
    const viewport = viewportRef.current

    // Add a small delay to ensure content is rendered and layout is stable
    requestAnimationFrame(() => {
      // Calculate target scroll position with extra padding for mobile
      const extraPadding = 60 // Account for mobile browser chrome and safe areas
      const targetScroll =
        viewport.scrollHeight - viewport.clientHeight + extraPadding

      viewport.scrollTo({
        top: targetScroll,
        behavior: isInitialLoadRef.current ? 'instant' : 'smooth',
      })

      // Double-check scroll position after a short delay
      setTimeout(() => {
        if (
          viewport.scrollTop + viewport.clientHeight <
          viewport.scrollHeight
        ) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'instant',
          })
        }
      }, 100)

      if (!hasGeneratingMessage) {
        setHasNewMessages(false)
        lastSeenContentRef.current = assistantMessagesContent
      }
    })
  }, [assistantMessagesContent, hasGeneratingMessage])

  // Auto-scroll when near bottom and:
  // 1. New messages are added
  // 2. Any assistant message is updated
  // 3. Messages are being generated
  useEffect(() => {
    const hasNewMessage = messages.length > lastMessagesLengthRef.current
    const hasAssistantUpdate = messages.some(m => m.role === 'assistant')
    const shouldAutoScroll =
      (isNearBottom || isInitialLoadRef.current) &&
      (hasNewMessage || hasAssistantUpdate || hasGeneratingMessage)

    if (shouldAutoScroll) {
      scrollToBottom()
    }

    lastMessagesLengthRef.current = messages.length
  }, [
    messages.length,
    allAssistantMessages,
    hasGeneratingMessage,
    scrollToBottom,
  ])

  // Track new messages - show indicator when not near bottom
  useEffect(() => {
    // Only show new messages if:
    // 1. We're not at the bottom
    // 2. Content has changed since last seen
    // 3. Not initial load
    // 4. No messages are being generated
    if (
      !isAtBottom &&
      assistantMessagesContent !== lastSeenContentRef.current &&
      !isInitialLoadRef.current &&
      !hasGeneratingMessage
    ) {
      setHasNewMessages(true)
    }
  }, [assistantMessagesContent, isAtBottom, hasGeneratingMessage])

  // Scroll to bottom on initial load with improved reliability
  useEffect(() => {
    if (!viewportRef.current || !isInitialLoadRef.current || !messages.length)
      return

    // Use RAF to ensure DOM is ready
    requestAnimationFrame(() => {
      if (viewportRef.current) {
        scrollToBottom()
        isInitialLoadRef.current = false
        lastSeenContentRef.current = assistantMessagesContent
      }
    })
  }, [messages.length, assistantMessagesContent, scrollToBottom])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current)
      }
    }
  }, [])

  // Handle connection state changes with delay
  useEffect(() => {
    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current)
    }

    // Consider the connection healthy if:
    // 1. We're connecting (readyState === 0)
    // 2. We're connected (readyState === 1)
    // 3. We're attempting to reconnect
    // 4. It's our first connection attempt
    const isConnectionHealthy =
      readyState === ReadyState.CONNECTING ||
      readyState === ReadyState.OPEN ||
      isAttemptingReconnect ||
      initialConnectionAttemptRef.current

    // After first successful connection or 10s timeout, mark initial attempt as done
    if (
      readyState === ReadyState.OPEN ||
      (!isConnectionHealthy && initialConnectionAttemptRef.current)
    ) {
      initialConnectionAttemptRef.current = false
    }

    if (!isConnectionHealthy) {
      // Add a 5 second delay before showing the alert
      alertTimeoutRef.current = setTimeout(() => {
        setShowAlert(true)
      }, 5000)
    } else {
      setShowAlert(false)
    }
  }, [readyState, isAttemptingReconnect])

  // Only render connection status after mount and delay
  const showConnectionClosedAlert = isMounted && isSignedIn && showAlert

  // Memoize the composer to prevent remounts
  const memoizedComposer = React.useMemo(
    () => (
      <LightboxGallery galleryKey={config.threadId}>
        <ComposerComponent {...config.composer} setIsDragging={setIsDragging} />
      </LightboxGallery>
    ),
    [config.threadId, config.composer, setIsDragging],
  )

  return (
    <Thread.Root config={config}>
      <Thread.Viewport
        ref={viewportRef}
        autoScroll={false}
        className="pt-0 px-1 md:px-2 relative"
      >
        {showLoadingState ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
            <LoadingIndicator className="w-12 h-12" />
          </div>
        ) : (
          <>
            {accept && (
              <div className="fixed top-16 right-0 bottom-0 left-0 md:left-[250px] pointer-events-none z-30">
                <ComposerAttachmentDropzone
                  isDragging={isDragging}
                  accept={accept}
                />
              </div>
            )}
            {showWelcomeScreen && (
              /* @ts-expect-error We're extending thread welcome hackishly with children */
              <ThreadWelcomeComponent>
                <ThreadPrimitive.If empty={true}>
                  {memoizedComposer}
                </ThreadPrimitive.If>
              </ThreadWelcomeComponent>
            )}

            <Thread.Messages
              components={{
                UserMessage: MyUserMessage,
                EditComposer: MyEditComposer,
                AssistantMessage: MyAssistantMessage,
              }}
            />
            <ThreadFollowupSuggestions />
          </>
        )}
        <Thread.ViewportFooter className="z-20">
          {showConnectionClosedAlert ? (
            <div className="w-full bg-accent mb-4 mt-2 rounded-lg overflow-hidden">
              <AlertDestructive title="Network connection lost" />
            </div>
          ) : null}
          <div className="relative">
            {/* Show button only when NOT initial load AND NOT at bottom AND (scrolled up OR has new messages) */}
            {!isInitialLoadRef.current &&
              !isAtBottom &&
              (isScrolled || hasNewMessages) && (
                <Button
                  variant="outline"
                  onClick={scrollToBottom}
                  className="absolute drop-shadow-md bottom-2 w-7 h-7 p-0 rounded-full hover:bg-accent flex items-center justify-center"
                >
                  <ArrowDownIcon className="w-5 h-5 drop-shadow-md" />
                  {hasNewMessages && (
                    <div
                      onClick={scrollToBottom}
                      className="absolute drop-shadow-md right-8 text-xs text-accent-foreground bg-purple-950 border border-purple-600 px-2 py-1 rounded-md cursor-pointer hover:bg-purple-700"
                    >
                      <span className="text-xs animate-pulse">
                        New messages
                      </span>
                    </div>
                  )}
                </Button>
              )}
          </div>

          {!showWelcomeScreen && (
            <ThreadPrimitive.If empty={!effectiveThreadId}>
              {memoizedComposer}
            </ThreadPrimitive.If>
          )}
        </Thread.ViewportFooter>
      </Thread.Viewport>
    </Thread.Root>
  )
}

export default MyThread
