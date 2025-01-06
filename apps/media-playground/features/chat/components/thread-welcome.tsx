'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { ThreadWelcome, useThreadConfig } from '@assistant-ui/react'
import React, { FC } from 'react'

const MyThreadWelcomeAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()
  return (
    <>
      <div className="text-sm text-muted-foreground mb-2">
        {avatar.fallback}
      </div>
      <Avatar className="w-16 h-16 md:w-24 md:h-24 col-start-1 row-span-full row-start-1">
        <AvatarImage
          className={'object-cover'}
          src={getCloudfrontOriginalUrl(avatar.src)}
        />
        <AvatarFallback delayMs={250} className="w-16 h-16 md:w-24 md:h-24">
          {avatar.fallback}
        </AvatarFallback>
      </Avatar>
    </>
  )
}

const MyThreadWelcome: FC = () => {
  return (
    <ThreadWelcome.Root>
      <ThreadWelcome.Center>
        <MyThreadWelcomeAvatar />
        <ThreadWelcome.Message />
      </ThreadWelcome.Center>
      <AuthClickGuard>
        <ThreadWelcome.Suggestions />
      </AuthClickGuard>
    </ThreadWelcome.Root>
  )
}

export default MyThreadWelcome
