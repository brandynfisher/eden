'use client'

import { LightboxGallery } from '@/components/media/lightbox'
import MyAttachment from '@/features/chat/components/attachment'
import { UserActionBar, UserMessage } from '@assistant-ui/react'
import React, { FC } from 'react'

const MyUserMessage: FC = () => {
  return (
    <UserMessage.Root className="mt-2">
      <LightboxGallery>
        <UserMessage.Attachments components={{ Attachment: MyAttachment }} />
      </LightboxGallery>
      <UserMessage.Content />
      <UserActionBar />
    </UserMessage.Root>
  )
}

export default MyUserMessage
