import ActionBar from './action-bar'
import { MarkdownText } from './markdown-text'
import { MessageAttachment } from './message-attachment'
import ToolResultActionBar from './tool-result-action-bar'
import { LightboxGallery } from '@/components/media/lightbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThoughtBlock } from '@/features/chat/components/thought-block'
import TypingIndicator from '@/features/chat/components/typing-indicator'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Message, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

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
  // Track optimistically cancelled tool calls
  const [optimisticallyCancelled, setOptimisticallyCancelled] = useState<
    Set<string>
  >(new Set())
  const [expanded, setExpanded] = useState(false)
  const contentLen = message.content?.length ?? 0
  const isHuge = contentLen > 40000 // character threshold
  const previewLimit = 8000 // render a safe preview chunk
  const preview = isHuge
    ? message.content!.slice(0, previewLimit)
    : message.content

  // Clean up optimistic state when backend confirms cancellation
  useEffect(() => {
    if (message.tool_calls) {
      const cancelledIds = message.tool_calls
        .filter(toolCall => toolCall.status === 'cancelled')
        .map(toolCall => toolCall.id)

      if (cancelledIds.length > 0) {
        setOptimisticallyCancelled(prev => {
          const newSet = new Set(prev)
          cancelledIds.forEach(id => newSet.delete(id))
          return newSet
        })
      }
    }
  }, [message.tool_calls])

  // Check if message has attachments
  const hasAttachments = message.attachments && message.attachments.length > 0

  if (
    !message.content &&
    !isStreamingTokens &&
    !hasAttachments &&
    (!message.tool_calls || message.tool_calls.length === 0)
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
        {/* Show thought for assistant messages */}
        {(() => {
          const shouldShowThought =
            message.role === 'assistant' &&
            message.thought &&
            message.thought.length > 0

          if (shouldShowThought) {
            return <ThoughtBlock thought={message.thought!} className="mb-4" />
          }
          return null
        })()}

        {hasAttachments && (
          <LightboxGallery galleryKey={message._id}>
            <div className="flex flex-wrap gap-2 mb-2">
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

        {!isEmpty && (
          <>
            {/* Preview */}
            {!expanded && (
              <div className="relative">
                <MarkdownText>{preview!}</MarkdownText>
                {isHuge && (
                  <div className="mt-2 flex">
                    <button
                      type="button"
                      className="text-xs underline text-muted-foreground hover:text-foreground"
                      onClick={() => setExpanded(true)}
                    >
                      Show full message ({contentLen.toLocaleString()}{' '}
                      characters)
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Full (own scroll) */}
            {expanded && (
              <div className="max-h-[60vh] overflow-y-auto rounded-md border p-3">
                <MarkdownText>{message.content!}</MarkdownText>
              </div>
            )}
          </>
        )}
        {message.tool_calls &&
          message.tool_calls.length > 0 &&
          message.tool_calls.map(toolCall => {
            // Create optimistic tool call with cancelled status if optimistically cancelled
            const optimisticToolCall = optimisticallyCancelled.has(toolCall.id)
              ? { ...toolCall, status: 'cancelled' as const }
              : toolCall

            return (
              <TaskResultTool
                key={toolCall.id}
                toolCall={optimisticToolCall}
                onCancel={async () => {
                  // Optimistically mark as cancelled
                  setOptimisticallyCancelled(prev =>
                    new Set(prev).add(toolCall.id),
                  )

                  try {
                    const response = await fetch(
                      `/api/sessions/${sessionId}/cancel`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          tool_call_id: toolCall.id,
                          tool_call_index:
                            message.tool_calls?.indexOf(toolCall),
                        }),
                      },
                    )
                    // Only revert if we get a definitive failure response
                    // For now, keep the cancelled UI even if the API call fails
                    // since the user clicked cancel and expects to see it cancelled
                    if (!response.ok) {
                      console.warn(
                        'Cancel API call failed, but keeping UI cancelled state',
                      )
                    }
                  } catch (error) {
                    console.warn(
                      'Cancel API call error, but keeping UI cancelled state:',
                      error,
                    )
                  }
                }}
              />
            )
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
