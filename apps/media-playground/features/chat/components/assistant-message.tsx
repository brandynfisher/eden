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
      <AvatarImage src={getCloudfrontOriginalUrl(avatar.src)} />
      <AvatarFallback delayMs={250} className="w-10 h-10 md:w-12 md:h-12">
        {avatar.fallback}
      </AvatarFallback>
    </Avatar>
  )
}

const MyAssistantMessage: FC = () => {
  return (
    <AssistantMessage.Root>
      <MyAssistantMessageAvatar />
      <AssistantMessage.Content />
      <BranchPicker />
      <AssistantActionBar />
    </AssistantMessage.Root>
  )
}

export default MyAssistantMessage
