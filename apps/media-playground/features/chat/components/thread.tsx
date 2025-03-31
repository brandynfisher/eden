'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { LightboxGallery } from '@/components/media/lightbox'
import MyAssistantMessage from '@/features/chat/components/assistant-message'
import {
  ComposerAttachmentDropzone,
  MyComposer,
} from '@/features/chat/components/composer'
import MyEditComposer from '@/features/chat/components/edit-composer'
import MyUserMessage from '@/features/chat/components/user-message'
import { useAuthState } from '@/hooks/use-auth-state'
import { useWebSocketContext } from '@/providers/websocket-provider'
import {
  ThreadPrimitive,
  useComposerRuntime,
  useThread,
} from '@assistant-ui/react'
import { Thread, ThreadConfig, ThreadWelcome } from '@assistant-ui/react-ui'
import { FC, useEffect, useRef, useState } from 'react'
import React from 'react'
import { ReadyState } from 'react-use-websocket'

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

  const [connectionLost, setConnectionLost] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { readyState } = useWebSocketContext()
  const { isSignedIn } = useAuthState()
  const [isDragging, setIsDragging] = useState(false)
  const composerRuntime = useComposerRuntime()
  const accept = composerRuntime?.getAttachmentAccept()
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const viewportRef = useRef<HTMLDivElement>(null)
  const messages = useThread(t => t.messages)
  const isRunning = useThread(t => t.isRunning)

  // Get the threadId from the URL if available
  const urlThreadId =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)[2] // /chat/agentName/threadId
      : undefined
  const effectiveThreadId = threadId || urlThreadId

  // Show welcome screen when no threadId is present
  const showWelcomeScreen = !effectiveThreadId

  // Only show loading when:
  // 1. Component is mounted (to avoid double loading states with parent)
  // 2. We have a threadId but no messages yet
  const showLoadingState =
    isMounted && Boolean(effectiveThreadId) && messages.length === 0

  // Debug logging - only log on important state changes
  useEffect(() => {
    const state = {
      threadId,
      urlThreadId,
      effectiveThreadId,
      messagesLength: messages.length,
      showWelcomeScreen,
      showLoadingState,
      isMounted,
    }

    // Only log if something important changed
    if (
      state.messagesLength === 0 ||
      state.showLoadingState ||
      !state.isMounted
    ) {
      console.log('Thread state:', state)
    }
  }, [
    threadId,
    urlThreadId,
    effectiveThreadId,
    messages.length,
    showWelcomeScreen,
    showLoadingState,
    isMounted,
  ])

  // Mount effect - only run once
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Delay setting isMounted slightly to avoid flash of loading state
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Scroll to bottom on initial load and when user sends a message
  useEffect(() => {
    if (!viewportRef.current) return
    if (!messages.length || !isRunning) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [messages.length, isRunning])

  // Debounce connection status changes to prevent rapid remounts
  const handleConnectionChange = React.useCallback((isOnline: boolean) => {
    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }

    // Add delay before updating connection status
    // Longer delay (2s) for showing the alert, shorter delay (500ms) for hiding it
    const delay = isOnline ? 500 : 5000

    connectionTimeoutRef.current = setTimeout(() => {
      setConnectionLost(prev => {
        if (prev === !isOnline) return prev
        return !isOnline
      })
    }, delay)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsMounted(true)

    const handleOnline = () => handleConnectionChange(true)
    const handleOffline = () => handleConnectionChange(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator) {
      // Check connection status after mount
      const isOffline =
        !navigator.onLine ||
        readyState === ReadyState.CLOSED ||
        readyState === ReadyState.CLOSING

      handleConnectionChange(!isOffline)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
    }
  }, [readyState, handleConnectionChange])

  // Only render connection status after mount
  const showConnectionLost = isMounted && isSignedIn && connectionLost

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
        autoScroll={true}
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
          {showConnectionLost ? (
            <div className="w-full bg-accent mb-4 mt-2 rounded-lg overflow-hidden">
              <AlertDestructive title="Network connection lost" />
            </div>
          ) : null}
          <Thread.ScrollToBottom />

          <ThreadPrimitive.If empty={!effectiveThreadId}>
            {memoizedComposer}
          </ThreadPrimitive.If>
        </Thread.ViewportFooter>
      </Thread.Viewport>
    </Thread.Root>
  )
}

export default MyThread
