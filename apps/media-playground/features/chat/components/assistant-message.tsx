'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { pinMessage, unpinMessage } from '@/features/chat/chat-api'
import TypingIndicator from '@/features/chat/components/typing-indicator'
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
import { type ThreadMessage as EdenThreadMessage } from '@edenlabs/eden-sdk'
import { PinIcon, PinOffIcon } from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import React, { type FC, useState } from 'react'

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
  const id = useMessage(m => m.id)
  const myMessages = useMessage(m =>
    getExternalStoreMessages(m),
  ) as EdenThreadMessage[]
  const [pinnedState, setPinnedState] = useState(myMessages[0].pinned)
  const reactions = myMessages[0].reactions || {}

  const { user } = useAuthState()
  const userId = user?._id || null

  const hasThumbsUp = userId ? reactions.thumbs_up?.includes(userId) : false
  const hasThumbsDown = userId ? reactions.thumbs_down?.includes(userId) : false

  return (
    <AssistantActionBar.Root
      autohide="not-last"
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

      <Button
        variant={'ghost'}
        size="icon"
        className="p-0.5 w-6 h-6 hover:text-foreground hover:bg-muted"
        onClick={async () => {
          if (pinnedState) {
            unpinMessage(id)
            setPinnedState(false)
          } else {
            pinMessage(id)
            setPinnedState(true)
          }
        }}
      >
        {pinnedState ? (
          <PinOffIcon className="w-4 h-4 text-purple-600" />
        ) : (
          <PinIcon className="w-4 h-4" />
        )}
      </Button>

      <div
        className="ml-auto text-xs bg-transparent"
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
  const isEmpty = typeof content === 'undefined' || content.length === 0

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
      <AssistantMessage.Content key={id} className="pl-3 !max-w-full pr-2" />
      {/* )} */}
      <BranchPicker />
      {isEmpty || isRunning ? ( // Use raw isEmpty and isRunning
        <div className="col-start-3 row-start-2">
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
