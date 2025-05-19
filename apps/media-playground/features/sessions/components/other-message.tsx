import ActionBar from './action-bar'
import { MarkdownText } from './markdown-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { getCloudfrontUrl } from '@/lib/media'
import { ThreadMessage } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'

export const OtherMessage = ({ message }: { message: ThreadMessage }) => {
  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
    }
  }

  return (
    <div className="flex justify-start">
      <div className="aui-assistant-message-root block px-2 md:grid group relative">
        <div className="flex items-center md:items-start mr-2">
          <Avatar className="w-12 h-12">
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
        </div>
        <div className="aui-assistant-message-content mt-1.5 pl-3 pr-2 max-w-full">
          <MarkdownText>{message.content ?? ''}</MarkdownText>
          {message.tool_calls?.map(toolCall => (
            <TaskResultTool key={toolCall.id} toolCall={toolCall} />
          ))}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionBar
              id={message.id}
              createdAt={message.createdAt.toISOString()}
              pinned={message.pinned}
              reactions={message.reactions}
              onCopy={handleCopy}
              onFeedbackPositive={() => {
                // TODO: Implement feedback positive
              }}
              onFeedbackNegative={() => {
                // TODO: Implement feedback negative
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
