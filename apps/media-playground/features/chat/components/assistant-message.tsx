'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToolResultActionBar } from '@/features/chat/components/tool-result-action-bar'
import { ToolHoverMenu } from '@/features/chat/components/tools/tool-hover-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  ThreadPrimitive,
  getExternalStoreMessages,
  useMessage,
} from '@assistant-ui/react'
import {
  AssistantActionBar,
  AssistantMessage,
  BranchPicker,
  useThreadConfig,
} from '@assistant-ui/react-ui'
import {
  type ThreadMessage as EdenThreadMessage,
  TaskV2Result,
} from '@edenlabs/eden-sdk'
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
  const myMessages = useMessage(m =>
    getExternalStoreMessages(m),
  ) as EdenThreadMessage[]
  const reactions = myMessages[0].reactions || {}

  const { user } = useAuthState()
  const userId = user?._id || null

  const hasThumbsUp = userId ? reactions.thumbs_up?.includes(userId) : false
  const hasThumbsDown = userId ? reactions.thumbs_down?.includes(userId) : false

  // Get completed tool calls with results
  const completedToolCalls =
    myMessages[0].tool_calls?.filter(
      toolCall =>
        toolCall.status === 'completed' &&
        toolCall.result &&
        toolCall.result.length > 0 &&
        toolCall.result.some((result: TaskV2Result) => {
          if (!result?.output) return false
          return (
            Array.isArray(result.output) ||
            (typeof result.output === 'string' &&
              (result.output as string).length > 0)
          )
        }),
    ) || []

  return (
    <AssistantActionBar.Root
      autohide={completedToolCalls.length > 0 ? 'never' : 'not-last'}
      autohideFloat="single-branch"
      className="flex items-center gap-2 w-full z-10"
    >
      <AssistantActionBar.Copy />
      <AssistantActionBar.FeedbackPositive
        className={cn(
          hasThumbsUp ? 'text-green-600' : '!text-muted-foreground',
        )}
      />
      <AssistantActionBar.FeedbackNegative
        className={cn(
          hasThumbsDown ? 'text-red-600' : '!text-muted-foreground',
        )}
      />

      <div className="ml-auto flex items-center gap-2">
        {completedToolCalls.map((toolCall, index) => (
          <ToolHoverMenu
            key={`${toolCall.id}-${index}`}
            toolName={toolCall.tool!}
            args={toolCall.args}
          />
        ))}
        <div
          className="text-xs bg-transparent"
          title={new Date(createdAt).toLocaleString()}
        >
          <TimeAgo date={new Date(createdAt)} />
        </div>
      </div>
    </AssistantActionBar.Root>
  )
}

const MyAssistantMessage: FC = () => {
  // const content = useMessage(m => m.content)
  const status = useMessage(m => m.status)
  const myMessages = useMessage(m =>
    getExternalStoreMessages(m),
  ) as EdenThreadMessage[]

  // Memoize the derived state to prevent unnecessary recalculations
  // const { isEmpty, isRunning } = React.useMemo(() => {
  //   const newIsEmpty = !content || content.length === 0
  //   const newIsRunning = status?.type === 'running'

  //   if (newIsRunning) {
  //     console.log('[MyAssistantMessage] newIsRunning:', {
  //       id,
  //       isEmpty: newIsEmpty,
  //       isRunning: newIsRunning,
  //       content,
  //       status,
  //     })
  //   }

  //   return {
  //     isEmpty: newIsEmpty,
  //     isRunning: newIsRunning,
  //   }
  // }, [id, content, status])
  // const myMessages = useMessage(m =>
  //   getExternalStoreMessages(m),
  // ) as EdenThreadMessage[]
  const isRunning = status?.type === 'running'
  // const isEmpty = typeof content === 'undefined' || content.length === 0

  // if (isRunning || isEmpty) {
  //   console.log('[MyAssistantMessage]:', status, id)
  // }

  // console.log('[MyAssistantMessage]:', {
  //   isRunning,
  //   isEmpty,
  //   content,
  //   status,
  //   id,
  // })

  return (
    <AssistantMessage.Root
      className={cn([
        'block px-2 md:grid',
        isRunning && // Use raw isRunning
          'border border-purple-600/40 bg-purple-900/5 rounded-lg',
      ])}
    >
      <MyAssistantMessageAvatar />
      {/* {!isEmpty && ( // Use raw isEmpty */}
      <AssistantMessage.Content className="pl-3 !max-w-full pr-2" />
      {/* )} */}
      <BranchPicker />
      {/* {isEmpty || isRunning ? ( // Use raw isEmpty and isRunning
        <div className="col-start-3 row-start-2 bg-red-500">
          <TypingIndicator />
        </div>
      ) : null} */}

      <ThreadPrimitive.If running={false} empty={false}>
        {myMessages[0]?.tool_calls?.some(
          toolCall =>
            toolCall.status === 'completed' &&
            toolCall.result &&
            toolCall.result.length > 0 &&
            toolCall.result.some(
              result =>
                result &&
                Array.isArray(result?.output) &&
                result.output.some(output => output.creation),
            ),
        ) ? (
          <ToolResultActionBar />
        ) : (
          <MyAssistantActionBar />
        )}
      </ThreadPrimitive.If>
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
