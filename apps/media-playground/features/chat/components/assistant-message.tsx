'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { ThreadPrimitive, useMessage } from '@assistant-ui/react'
import {
  AssistantActionBar,
  AssistantMessage,
  BranchPicker,
  useThreadConfig,
} from '@assistant-ui/react-ui'
import { useTimeAgo } from 'next-timeago'
import React, { type FC } from 'react'

const MyAssistantMessageAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()
  return (
    <div className="flex items-center md:items-start mr-2">
      <Avatar className="w-10 h-10 md:w-12 md:h-12">
        <AvatarImage
          className={'object-cover'}
          src={getCloudfrontOriginalUrl(avatar.src)}
        />
        <AvatarFallback delayMs={250} className="w-10 h-10 md:w-12 md:h-12">
          {avatar.fallback}
        </AvatarFallback>
      </Avatar>
      <div className="block ml-2 md:hidden text-sm text-muted-foreground">
        {avatar.fallback}
      </div>
    </div>
  )
}

const MyAssistantActionBar: FC = () => {
  const { TimeAgo } = useTimeAgo()
  const createdAt = useMessage(m => m.createdAt)
  return (
    <AssistantActionBar.Root
      // hideWhenRunning
      // autohide="not-last"
      autohide="not-last"
      autohideFloat="single-branch"
      className="flex items-center gap-2 w-full z-10"
    >
      {/*<AssistantActionBar.SpeechControl />*/}
      <AssistantActionBar.Copy />
      {/*<AssistantActionBar.Reload />*/}
      <AssistantActionBar.FeedbackPositive />
      <AssistantActionBar.FeedbackNegative />

      <div
        className="ml-auto text-xs text-muted-foreground"
        title={new Date(createdAt).toLocaleString()}
      >
        <TimeAgo date={new Date(createdAt)} />
      </div>
    </AssistantActionBar.Root>
  )
}

const MyAssistantMessage: FC = () => {
  const content = useMessage(m => m.content)
  const status = useMessage(m => m.status)
  const id = useMessage(m => m.id)

  // Memoize the derived state to prevent unnecessary recalculations
  const { isEmpty, isRunning } = React.useMemo(
    () => ({
      isEmpty: !content || content.length === 0,
      isRunning: status?.type === 'running',
    }),
    [content, status?.type],
  )

  // Track previous state to prevent unnecessary flashing
  const prevStateRef = React.useRef({ isEmpty, isRunning })
  const [debouncedState, setDebouncedState] = React.useState({
    isEmpty,
    isRunning,
  })

  React.useEffect(() => {
    // Only update if the state has been stable for the debounce period
    // and is different from the current debounced state
    if (
      isEmpty !== prevStateRef.current.isEmpty ||
      isRunning !== prevStateRef.current.isRunning
    ) {
      prevStateRef.current = { isEmpty, isRunning }

      // For transitions to empty/running state, add a small delay
      // For transitions to non-empty/non-running state, update immediately
      const delay = isEmpty || isRunning ? 100 : 0

      const timer = setTimeout(() => {
        // Only update if the state hasn't changed during the delay
        if (
          isEmpty === prevStateRef.current.isEmpty &&
          isRunning === prevStateRef.current.isRunning
        ) {
          setDebouncedState({ isEmpty, isRunning })
        }
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [isEmpty, isRunning])

  return (
    <AssistantMessage.Root
      className={cn([
        'block px-2 md:grid',
        debouncedState.isRunning &&
          'border border-purple-600/40 bg-purple-900/5 rounded-lg',
      ])}
    >
      <MyAssistantMessageAvatar />
      {!debouncedState.isEmpty && (
        <AssistantMessage.Content key={id} className="pl-3 !max-w-full pr-2" />
      )}
      <BranchPicker />
      {debouncedState.isEmpty || debouncedState.isRunning ? (
        <div
          className={cn(
            'col-start-3 row-start-2',
            debouncedState.isEmpty && 'col-start-auto row-start-auto mt-2',
          )}
        >
          <TypingIndicator />
        </div>
      ) : null}

      <ThreadPrimitive.If running={false} empty={false}>
        <MyAssistantActionBar />
      </ThreadPrimitive.If>
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
