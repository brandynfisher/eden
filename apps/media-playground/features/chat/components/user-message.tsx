'use client'

import { LightboxGallery } from '@/components/media/lightbox'
import MyAttachment from '@/features/chat/components/attachment'
import { UserActionBar, UserMessage, useMessage } from '@assistant-ui/react'
import React, { FC } from 'react'

const MyUserMessage: FC = () => {
  const message = useMessage()

  return (
    <UserMessage.Root className="mt-2">
      <LightboxGallery galleryKey={message.id}>
        <UserMessage.Attachments components={{ Attachment: MyAttachment }} />
      </LightboxGallery>
      <UserMessage.Content />
      <UserActionBar />
    </UserMessage.Root>
  )
}

export default MyUserMessage
