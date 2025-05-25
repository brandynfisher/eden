import ActionBar from './action-bar'
import { MarkdownText } from './markdown-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { getCloudfrontUrl } from '@/lib/media'
import { Message } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'

type OtherMessageProps = {
  sessionId: string
  message: Message
  showAvatar?: boolean
}

export const OtherMessage = ({
  sessionId,
  message,
  showAvatar = true,
}: OtherMessageProps) => {
  if (!message.content) return null

  return (
    <div className="aui-assistant-message-root block px-2 md:grid group relative py-2">
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
        <MarkdownText>{message.content}</MarkdownText>
        {message.tool_calls?.map(toolCall => (
          <TaskResultTool key={toolCall.id} toolCall={toolCall} />
        ))}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBar sessionId={sessionId} message={message} />
        </div>
      </div>
    </div>
  )
}
