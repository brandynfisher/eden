'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import { useEdenRuntimeExtras } from '@/features/chat/hooks/useEdenRuntime'
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
  const threadId = useEdenRuntimeExtras(extras => extras.threadId)

  // Use a ref to track when the component mounted or thread changed
  // const mountTimeRef = React.useRef(Date.now())

  // Reset the mount time when thread changes
  // React.useEffect(() => {
  //   mountTimeRef.current = Date.now()
  //   console.log('[TypingIndicator] Thread changed or component mounted', {
  //     threadId,
  //   })
  // }, [threadId])

  // Memoize the derived state to prevent unnecessary recalculations
  const { isEmpty, isRunning } = React.useMemo(() => {
    const newIsEmpty = !content || content.length === 0
    const newIsRunning = status?.type === 'running'

    // console.log('[TypingIndicator] State calculation', {
    //   threadId,
    //   messageId: id,
    //   isEmpty: newIsEmpty,
    //   isRunning: newIsRunning,
    //   timeSinceMount: Date.now() - mountTimeRef.current,
    // })

    return {
      isEmpty: newIsEmpty,
      isRunning: newIsRunning,
    }
  }, [content, status?.type, threadId, id])

  // Log state changes
  // React.useEffect(() => {
  //   console.log('[TypingIndicator] Indicator state updated', {
  //     shouldShow: isEmpty || isRunning,
  //     isEmpty,
  //     isRunning,
  //     threadId,
  //   })
  // }, [isEmpty, isRunning, threadId])

  return (
    <AssistantMessage.Root
      className={cn([
        'block px-2 md:grid',
        isRunning && // Use raw isRunning
          'border border-purple-600/40 bg-purple-900/5 rounded-lg',
      ])}
    >
      <MyAssistantMessageAvatar />
      {!isEmpty && ( // Use raw isEmpty
        <AssistantMessage.Content key={id} className="pl-3 !max-w-full pr-2" />
      )}
      <BranchPicker />
      {isEmpty || isRunning ? ( // Use raw isEmpty and isRunning
        <div
          className={cn(
            'col-start-3 row-start-2',
            isEmpty && 'col-start-auto row-start-auto mt-2', // Use raw isEmpty
          )}
        >
          <TypingIndicator />
        </div>
      ) : null}

      <div className="absolute bottom-0 right-0 flex items-center gap-2">
        <div className="text-muted-foreground p-1 bg-muted rounded-md">
          Running:{' '}
          <span
            className={cn(
              isRunning && 'text-accent-foreground bg-blue-700 p-1 rounded-md',
            )}
          >
            {isRunning ? 'true' : 'false'}
          </span>
        </div>
        <div className="text-muted-foreground p-1 bg-muted rounded-md">
          Empty:{' '}
          <span
            className={cn(
              isEmpty && 'text-accent-foreground bg-blue-700 p-1 rounded-md',
            )}
          >
            {isEmpty ? 'true' : 'false'}
          </span>
        </div>
      </div>
      <ThreadPrimitive.If running={false} empty={false}>
        <MyAssistantActionBar />
      </ThreadPrimitive.If>
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
