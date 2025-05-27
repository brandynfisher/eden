import ActionBar from './action-bar'
import { MarkdownText } from './markdown-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Message } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'

type OtherMessageProps = {
  sessionId: string
  message: Message
  showAvatar?: boolean
  isStreamingTokens?: boolean
}

export const OtherMessage = ({
  sessionId,
  message,
  showAvatar = true,
  isStreamingTokens = false,
}: OtherMessageProps) => {
  if (
    !message.content &&
    !isStreamingTokens &&
    (!message.tool_calls || message.tool_calls.length === 0)
  )
    return null

  const isEmpty = !message.content || message.content.length === 0

  return (
    <div
      className={cn([
        'aui-assistant-message-root block px-2 md:grid group relative py-2',
      ])}
    >
      <div className="flex items-center md:items-start mr-1 gap-2">
        <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0">
          {showAvatar ? (
            <Avatar className="w-full h-full" title={message.sender?.username}>
              <AvatarImage
                src={
                  message.sender?.userImage
                    ? getCloudfrontUrl(message.sender.userImage)
                    : undefined
                }
              />
              <AvatarFallback>
                {message.sender?.username ? (
                  `${message.sender?.username?.charAt(
                    0,
                  )}${message.sender?.username?.charAt(1)}`
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
        <div className="text-muted-foreground text-sm md:hidden">
          {message.sender?.username}
        </div>
      </div>
      <div className="aui-assistant-message-content mt-3 md:mt-1.5 md:pl-3 pr-2 max-w-full">
        {!isEmpty && <MarkdownText>{message.content}</MarkdownText>}
        {message.tool_calls &&
          message.tool_calls.length > 0 &&
          message.tool_calls.map(toolCall => {
            return <TaskResultTool key={toolCall.id} toolCall={toolCall} />
          })}

        {/* Show typing indicator when streaming tokens and content is empty */}
        {!message.tool_calls && isStreamingTokens && (
          <div className="py-2">
            <TypingIndicator />
          </div>
        )}

        {!isStreamingTokens && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionBar sessionId={sessionId} message={message} />
          </div>
        )}
      </div>
    </div>
  )
}
