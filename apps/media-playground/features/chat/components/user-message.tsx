'use client'

import { LightboxGallery } from '@/components/media/lightbox'
import MyAttachment from '@/features/chat/components/attachment'
import { UserActionBar, UserMessage, useMessage } from '@assistant-ui/react'
import React, { FC } from 'react'

const MyUserMessage: FC = () => {
  const messageId = useMessage(m => m.id)
  const content = useMessage(m => m.content)

  const isEmptyText =
    content.length === 1 && content[0].type === 'text' && content[0].text === ''

  return (
    <UserMessage.Root className="mt-2">
      <LightboxGallery galleryKey={messageId}>
        <UserMessage.Attachments components={{ Attachment: MyAttachment }} />
      </LightboxGallery>
      {!isEmptyText ? <UserMessage.Content /> : null}
      <UserActionBar />
    </UserMessage.Root>
  )
}

export default MyUserMessage
