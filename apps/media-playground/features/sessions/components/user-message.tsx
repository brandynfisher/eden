import { MessageAttachment } from './message-attachment'
import { LightboxGallery } from '@/components/media/lightbox'
import { MarkdownText } from '@/features/sessions/components/markdown-text'
import { Message } from '@edenlabs/eden-sdk'

export const UserMessage = ({ message }: { message: Message }) => {
  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasContent = message.content && message.content.trim().length > 0

  if (!hasContent && !hasAttachments) return null

  return (
    <div className="flex justify-end py-2">
      <div className="flex flex-col items-end gap-2">
        {hasAttachments && (
          <LightboxGallery galleryKey={message._id}>
            <div className="flex flex-wrap gap-2 justify-end">
              {message.attachments?.map((attachment, index) => (
                <MessageAttachment
                  key={attachment}
                  url={attachment}
                  index={index}
                />
              ))}
            </div>
          </LightboxGallery>
        )}
        {hasContent && (
          <div className="aui-user-message-content">
            <MarkdownText>{message.content!}</MarkdownText>
          </div>
        )}
      </div>
    </div>
  )
}
