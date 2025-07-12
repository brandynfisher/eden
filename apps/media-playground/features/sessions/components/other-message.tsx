import ActionBar from './action-bar'
import { MarkdownText } from './markdown-text'
import ToolResultActionBar from './tool-result-action-bar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Message, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'

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
  // Check if all tool calls are cancelled
  const hasActiveToolCalls = message.tool_calls?.some(
    toolCall => toolCall.status !== 'cancelled',
  )

  if (
    !message.content &&
    !isStreamingTokens &&
    (!message.tool_calls ||
      message.tool_calls.length === 0 ||
      !hasActiveToolCalls)
  )
    return null

  const isEmpty = !message.content || message.content.length === 0
  const hasUsername = !!message.sender?.username
  // Make ANY sender with a username clickable - fuck the type checking
  const shouldMakeClickable = hasUsername

  const finalImageUrl = message.sender?.userImage
    ? message.sender.userImage.startsWith('https://')
      ? message.sender.userImage // Already a full URL, don't process again
      : getCloudfrontUrl(message.sender.userImage) // Convert filename to URL
    : undefined

  return (
    <div
      className={cn([
        'aui-assistant-message-root block px-2 md:grid group relative py-2',
      ])}
    >
      <div className="flex items-center md:items-start mr-1 gap-2">
        {shouldMakeClickable ? (
          <Link
            href={`/chat/${message.sender.username}`}
            className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0 block relative"
            style={{ minWidth: '2rem', minHeight: '2rem' }}
          >
            {showAvatar ? (
              <Avatar className="w-full h-full cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={finalImageUrl} />
                <AvatarFallback>
                  {message.sender?.username ? (
                    <svg className="w-full h-full" viewBox="0 0 40 40">
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-current text-sm font-medium"
                        style={{ fontSize: '14px' }}
                      >
                        {`${message.sender?.username?.charAt(
                          0,
                        )}${message.sender?.username?.charAt(1)}`}
                      </text>
                    </svg>
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full" />
            )}
          </Link>
        ) : (
          <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0">
            {showAvatar ? (
              <Avatar className="w-full h-full">
                <AvatarImage src={finalImageUrl} />
                <AvatarFallback>
                  {message.sender?.username ? (
                    <svg className="w-full h-full" viewBox="0 0 40 40">
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-current text-sm font-medium"
                        style={{ fontSize: '14px' }}
                      >
                        {`${message.sender?.username?.charAt(
                          0,
                        )}${message.sender?.username?.charAt(1)}`}
                      </text>
                    </svg>
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            ) : null}
          </div>
        )}
        <div className="text-muted-foreground text-sm md:hidden">
          {shouldMakeClickable ? (
            <Link
              href={`/chat/${message.sender.username}`}
              className="hover:underline"
            >
              {message.sender?.username}
            </Link>
          ) : (
            message.sender?.username
          )}
        </div>
      </div>
      <div className="aui-assistant-message-content mt-3 md:mt-1.5 md:pl-3 pr-2 max-w-full">
        {!isEmpty && <MarkdownText>{message.content}</MarkdownText>}
        {message.tool_calls &&
          message.tool_calls.length > 0 &&
          message.tool_calls
            .filter(toolCall => toolCall.status !== 'cancelled')
            .map(toolCall => {
              return <TaskResultTool key={toolCall.id} toolCall={toolCall} />
            })}

        {/* Show typing indicator when streaming tokens and no content yet */}
        {isStreamingTokens && isEmpty && !message.tool_calls && (
          <div className="py-2">
            <TypingIndicator />
          </div>
        )}

        {!isStreamingTokens && (
          <div
            className={`transition-opacity ${
              message.tool_calls?.some(
                toolCall =>
                  toolCall.status === 'completed' &&
                  toolCall.result &&
                  (toolCall.result as TaskV2Result[]).length > 0 &&
                  toolCall.result.some(
                    (result: TaskV2Result) =>
                      result &&
                      (Array.isArray(result?.output) ||
                        (typeof result?.output === 'string' &&
                          (result?.output as string).length > 0)),
                  ),
              )
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {message.tool_calls?.some(
              toolCall =>
                toolCall.status === 'completed' &&
                toolCall.result &&
                toolCall.result.length > 0 &&
                toolCall.result.some(
                  (result: TaskV2Result) =>
                    result &&
                    Array.isArray(result?.output) &&
                    result.output.some(
                      (output: TasksV2ResultOutput) => output.creation,
                    ),
                ),
            ) ? (
              <ToolResultActionBar message={message} />
            ) : (
              <ActionBar sessionId={sessionId} message={message} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
