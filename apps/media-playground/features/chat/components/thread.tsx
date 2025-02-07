'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
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
  Thread,
  ThreadConfig,
  ThreadPrimitive,
  ThreadWelcome,
  useComposerRuntime,
  useThread,
} from '@assistant-ui/react'
import { FC, useEffect, useState } from 'react'
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
}

const MyThread: FC<ThreadConfigWithExtras> = config => {
  const {
    components: {
      Composer: ComposerComponent = MyComposer,
      ThreadWelcome: ThreadWelcomeComponent = ThreadWelcome,
    } = {},
  } = config

  const [connectionLost, setConnectionLost] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { readyState } = useWebSocketContext()
  const { isSignedIn } = useAuthState()
  const [isDragging, setIsDragging] = useState(false)
  const composerRuntime = useComposerRuntime()
  const accept = composerRuntime?.getAttachmentAccept()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsMounted(true)

    const handleOnline = () => setConnectionLost(false)
    const handleOffline = () => setConnectionLost(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (navigator) {
      // Check connection status after mount
      if (
        !navigator.onLine ||
        readyState === ReadyState.CLOSED ||
        readyState === ReadyState.CLOSING
      ) {
        setConnectionLost(true)
      } else {
        setConnectionLost(false)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [readyState])

  // Only render connection status after mount
  const showConnectionLost = isMounted && isSignedIn && connectionLost

  return (
    <Thread.Root config={config}>
      <Thread.Viewport className="pt-0 px-1 md:px-2 relative">
        {accept && (
          <div className="fixed top-16 left-0 right-0 bottom-0 pointer-events-none z-30">
            <ComposerAttachmentDropzone
              isDragging={isDragging}
              accept={accept}
            />
          </div>
        )}
        <ThreadWelcomeComponent />
        <Thread.Messages
          components={{
            UserMessage: MyUserMessage,
            EditComposer: MyEditComposer,
            AssistantMessage: MyAssistantMessage,
          }}
        />
        <ThreadFollowupSuggestions />
        <Thread.ViewportFooter className="z-20">
          {showConnectionLost ? (
            <div className="w-full bg-accent mb-4 mt-2 rounded-lg overflow-hidden">
              <AlertDestructive title="Network connection lost" />
            </div>
          ) : null}
          <Thread.ScrollToBottom />
          <ComposerComponent
            {...config.composer}
            setIsDragging={setIsDragging}
          />
        </Thread.ViewportFooter>
      </Thread.Viewport>
    </Thread.Root>
  )
}

export default MyThread
