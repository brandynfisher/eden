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
    <Avatar className="w-10 h-10 md:w-12 md:h-12 col-start-1 row-span-full row-start-1 mr-4">
      <AvatarImage
        className={'object-cover object-top'}
        src={getCloudfrontOriginalUrl(avatar.src)}
      />
      <AvatarFallback delayMs={250} className="w-10 h-10 md:w-12 md:h-12">
        {avatar.fallback}
      </AvatarFallback>
    </Avatar>
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
    <AssistantMessage.Root>
      <MyAssistantMessageAvatar />
      <AssistantMessage.Content />
      <BranchPicker />
      <MyAssistantActionBar />
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
