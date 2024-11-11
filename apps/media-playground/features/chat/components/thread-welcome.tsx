'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { ThreadWelcome, useThreadConfig } from '@assistant-ui/react'
import { FC } from 'react'

const MyThreadWelcomeAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()
  return (
    <Avatar className="w-16 h-16 md:w-24 md:h-24 col-start-1 row-span-full row-start-1 mr-4">
      <AvatarImage src={getCloudfrontOriginalUrl(avatar.src)} />
      <AvatarFallback delayMs={250} className="w-16 h-16 md:w-24 md:h-24">
        {avatar.fallback}
      </AvatarFallback>
    </Avatar>
  )
}

const MyThreadWelcome: FC = () => {
  return (
    <ThreadWelcome.Root>
      <ThreadWelcome.Center>
        <MyThreadWelcomeAvatar />
        <ThreadWelcome.Message />
      </ThreadWelcome.Center>
      <ThreadWelcome.Suggestions />
    </ThreadWelcome.Root>
  )
}

export default MyThreadWelcome
