import { MarkdownText } from '@/features/sessions/components/markdown-text'
import { SessionContentMessage } from '@edenlabs/eden-sdk'

export const UserMessage = ({
  message,
}: {
  message: SessionContentMessage
}) => {
  if (!message.content) return null

  return (
    <div className="flex justify-end">
      <div className="aui-user-message-content">
        <MarkdownText>{message.content}</MarkdownText>
      </div>
    </div>
  )
}
