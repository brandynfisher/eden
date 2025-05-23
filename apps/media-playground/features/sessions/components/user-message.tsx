import { MarkdownText } from '@/features/sessions/components/markdown-text'
import { Message } from '@edenlabs/eden-sdk'

export const UserMessage = ({ message }: { message: Message }) => {
  if (!message.content) return null

  return (
    <div className="flex justify-end py-2">
      <div className="aui-user-message-content">
        <MarkdownText>{message.content}</MarkdownText>
      </div>
    </div>
  )
}
