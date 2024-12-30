'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  AssistantActionBar,
  AssistantMessage,
  BranchPicker,
  useThreadConfig,
} from '@assistant-ui/react'
import type { FC } from 'react'

const MyAssistantMessageAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()
  return (
    <div className="flex items-center md:items-start">
      <Avatar className="w-10 h-10 md:w-12 md:h-12 mr-2 md:mr-4">
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
  return (
    <AssistantActionBar.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
    >
      {/*<AssistantActionBar.SpeechControl />*/}
      <AssistantActionBar.Copy />
      {/*<AssistantActionBar.Reload />*/}
      <AssistantActionBar.FeedbackPositive />
      <AssistantActionBar.FeedbackNegative />
    </AssistantActionBar.Root>
  )
}

const MyAssistantMessage: FC = () => {
  return (
    <AssistantMessage.Root className="block sm:grid">
      <MyAssistantMessageAvatar />
      <AssistantMessage.Content />
      <BranchPicker />
      <MyAssistantActionBar />
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
