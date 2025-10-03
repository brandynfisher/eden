import { MarkdownText } from './markdown-text'
import { Message } from '@edenlabs/eden-sdk'

interface SystemMessageProps {
  message: Message
}

export const SystemMessage = ({ message }: SystemMessageProps) => {
  if (!message.content) return null

  return (
    <div className="flex justify-center py-3">
      <div className="max-w-2xl w-full">
        <div className="text-[0.47rem] font-medium text-blue-600/50 dark:text-blue-400/50 mb-1 px-1">
          SYSTEM
        </div>
        <div className="bg-blue-100/40 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-3">
          <div className="text-sm text-blue-900/70 dark:text-blue-100/60">
            <MarkdownText>{message.content}</MarkdownText>
          </div>
        </div>
      </div>
    </div>
  )
}
