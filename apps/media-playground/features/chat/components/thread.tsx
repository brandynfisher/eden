'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import MyAssistantMessage from '@/features/chat/components/assistant-message'
import MyEditComposer from '@/features/chat/components/edit-composer'
import MyUserMessage from '@/features/chat/components/user-message'
import { useWebSocketContext } from '@/providers/websocket-provider'
import {
  Composer,
  Thread,
  ThreadConfig,
  ThreadPrimitive,
  ThreadWelcome,
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
      Composer: ComposerComponent = Composer,
      ThreadWelcome: ThreadWelcomeComponent = ThreadWelcome,
    } = {},
  } = config

  const [connectionLost, setConnectionLost] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { readyState } = useWebSocketContext()

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
  const showConnectionLost = isMounted && connectionLost

  return (
    <Thread.Root config={config}>
      <Thread.Viewport>
        <ThreadWelcomeComponent />
        <Thread.Messages
          components={{
            UserMessage: MyUserMessage,
            EditComposer: MyEditComposer,
            AssistantMessage: MyAssistantMessage,
          }}
        />
        <ThreadFollowupSuggestions />
        <Thread.ViewportFooter>
          {showConnectionLost ? (
            <div className="w-full bg-accent mb-4 mt-2 rounded-lg overflow-hidden">
              <AlertDestructive title="Network connection lost" />
            </div>
          ) : null}
          <Thread.ScrollToBottom />
          <ComposerComponent />
        </Thread.ViewportFooter>
      </Thread.Viewport>
    </Thread.Root>
  )
}

export default MyThread
