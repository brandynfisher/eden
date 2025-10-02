import { MarkdownText } from './markdown-text'
import { Message } from '@edenlabs/eden-sdk'
import { Info } from 'lucide-react'

interface SystemMessageProps {
  message: Message
}

export const SystemMessage = ({ message }: SystemMessageProps) => {
  if (!message.content) return null

  return (
    <div className="flex justify-center py-3">
      <div className="max-w-2xl w-full">
        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 px-1">
          SYSTEM
        </div>
        <div className="bg-blue-100/70 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <MarkdownText>{message.content}</MarkdownText>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
