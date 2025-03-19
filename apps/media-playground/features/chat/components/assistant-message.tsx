'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { useMessage } from '@assistant-ui/react'
import {
  AssistantActionBar,
  AssistantMessage,
  BranchPicker,
  useThreadConfig,
} from '@assistant-ui/react-ui'
import { useTimeAgo } from 'next-timeago'
import type { FC } from 'react'

const MyAssistantMessageAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()
  return (
    <div className="flex items-center md:items-start">
      <Avatar className="w-10 h-10 md:w-12 md:h-12">
        <AvatarImage
          className={'object-cover'}
          src={getCloudfrontOriginalUrl(avatar.src)}
        />
        <AvatarFallback delayMs={250} className="w-10 h-10 md:w-12 md:h-12">
          {avatar.fallback}
        </AvatarFallback>
      </Avatar>
      <div className="block md:hidden text-sm text-muted-foreground">
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
      hideWhenRunning
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
  const isEmpty = !content || content.length === 0
  const isRunning = status?.type === 'running'

  // console.log({ isEmpty, isRunning, content, status })

  return (
    <AssistantMessage.Root
      className={cn([
        'block px-2 md:px-0 md:grid',
        isRunning && 'border border-purple-600/40 bg-purple-900/5 rounded-lg',
      ])}
    >
      <MyAssistantMessageAvatar />
      <AssistantMessage.Content key={id} className="pl-3 !max-w-full pr-2" />
      <BranchPicker />
      <MyAssistantActionBar />
      {!isEmpty && isRunning && (
        <div className="col-start-3 row-start-2">
          <TypingIndicator />
        </div>
      )}
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
