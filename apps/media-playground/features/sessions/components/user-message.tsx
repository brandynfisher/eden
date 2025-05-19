import { MarkdownText } from '@/features/sessions/components/markdown-text'

export const UserMessage = ({ message }: { message: any }) => {
  return (
    <div className="flex justify-end">
      <div className="aui-user-message-content">
        <MarkdownText>{message.content}</MarkdownText>
      </div>
    </div>
  )
}
