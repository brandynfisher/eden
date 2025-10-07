import ActionBar from './action-bar'
import { AssistantContentRenderer } from './assistant-content-renderer'
import { MessageAttachment } from './message-attachment'
import ToolResultActionBar from './tool-result-action-bar'
import { LightboxGallery } from '@/components/media/lightbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { ThoughtBlock } from '@/features/sessions/components/thought-block'
import TypingIndicator from '@/features/sessions/components/typing-indicator'
import { getCloudfrontUrl } from '@/lib/media'
import { Message, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type AssistantMessageProps = {
  sessionId: string
  message: Message
  isStreamingTokens?: boolean
  showAvatar?: boolean
  isChatRoute?: boolean
}

export const AssistantMessage = ({
  sessionId,
  message,
  isStreamingTokens = false,
  showAvatar = true,
  isChatRoute = false,
}: AssistantMessageProps) => {
  // Track optimistically cancelled tool calls
  const [optimisticallyCancelled, setOptimisticallyCancelled] = useState<
    Set<string>
  >(new Set())
  const [expanded, setExpanded] = useState(false)
  const contentLen = message.content?.length ?? 0
  const isHuge = contentLen > 40000
  const previewLimit = 8000
  const preview = isHuge
    ? message.content!.slice(0, previewLimit)
    : message.content

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
  const shouldMakeClickable = hasUsername

  const finalImageUrl = message.sender?.userImage
    ? message.sender.userImage.startsWith('https://')
      ? message.sender.userImage
      : getCloudfrontUrl(message.sender.userImage)
    : undefined

  // Different layouts for /chat vs /sessions
  if (!isChatRoute) {
    // /sessions layout: compact on mobile, avatar on left on desktop
    return (
      <div className="py-2 group relative">
        {/* Mobile: Avatar, name, and content */}
        <div className="sm:hidden">
          {showAvatar && (
            <div className="flex items-center gap-2 mb-2">
              {shouldMakeClickable ? (
                <Link
                  href={`/chat/${message.sender.username}`}
                  className="inline-block"
                >
                  <Avatar className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={finalImageUrl} />
                    <AvatarFallback>
                      {message.sender?.username ? (
                        <svg className="w-full h-full" viewBox="0 0 24 24">
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-current text-xs font-medium"
                            style={{ fontSize: '10px' }}
                          >
                            {`${message.sender?.username?.charAt(
                              0,
                            )}${message.sender?.username?.charAt(1)}`}
                          </text>
                        </svg>
                      ) : (
                        <UserIcon className="w-3 h-3" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="w-6 h-6">
                  <AvatarFallback>
                    <UserIcon className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
              )}
              {message.sender?.name && (
                <span className="text-sm font-medium">
                  {message.sender.name}
                </span>
              )}
            </div>
          )}

          {/* Mobile content */}
          <div>
            {/* Show thought for assistant messages */}
            {(() => {
              const shouldShowThought =
                message.role === 'assistant' &&
                message.thought &&
                message.thought.length > 0

              if (shouldShowThought) {
                return (
                  <ThoughtBlock thought={message.thought!} className="mb-4" />
                )
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
                {!expanded && (
                  <div className="relative">
                    <AssistantContentRenderer>
                      {preview!}
                    </AssistantContentRenderer>
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
                {expanded && (
                  <div className="max-h-[60vh] overflow-y-auto rounded-md border p-3">
                    <AssistantContentRenderer>
                      {message.content!}
                    </AssistantContentRenderer>
                  </div>
                )}
              </>
            )}

            {message.tool_calls &&
              message.tool_calls.length > 0 &&
              message.tool_calls.map(toolCall => {
                const optimisticToolCall = optimisticallyCancelled.has(
                  toolCall.id,
                )
                  ? { ...toolCall, status: 'cancelled' as const }
                  : toolCall

                return (
                  <TaskResultTool
                    key={toolCall.id}
                    toolCall={optimisticToolCall}
                    onCancel={async () => {
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
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
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

        {/* Desktop: Avatar column - positioned to the left using negative margin */}
        {showAvatar && (
          <div className="hidden sm:block w-12 h-12 absolute -left-[calc(3rem+0.75rem)] top-2">
            {shouldMakeClickable ? (
              <Link
                href={`/chat/${message.sender.username}`}
                className="block w-full h-full"
              >
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
              </Link>
            ) : (
              <Avatar className="w-full h-full">
                <AvatarFallback>
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {/* Desktop: Content - full width */}
        <div className="hidden sm:block w-full">
          {/* Agent name */}
          {showAvatar && message.sender?.name && (
            <div className="text-sm font-medium mb-2">
              {message.sender.name}
            </div>
          )}

          {/* Message content - desktop */}
          <div>
            {/* Show thought for assistant messages */}
            {(() => {
              const shouldShowThought =
                message.role === 'assistant' &&
                message.thought &&
                message.thought.length > 0

              if (shouldShowThought) {
                return (
                  <ThoughtBlock thought={message.thought!} className="mb-4" />
                )
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
                {!expanded && (
                  <div className="relative">
                    <AssistantContentRenderer>
                      {preview!}
                    </AssistantContentRenderer>
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
                {expanded && (
                  <div className="max-h-[60vh] overflow-y-auto rounded-md border p-3">
                    <AssistantContentRenderer>
                      {message.content!}
                    </AssistantContentRenderer>
                  </div>
                )}
              </>
            )}

            {message.tool_calls &&
              message.tool_calls.length > 0 &&
              message.tool_calls.map(toolCall => {
                const optimisticToolCall = optimisticallyCancelled.has(
                  toolCall.id,
                )
                  ? { ...toolCall, status: 'cancelled' as const }
                  : toolCall

                return (
                  <TaskResultTool
                    key={toolCall.id}
                    toolCall={optimisticToolCall}
                    onCancel={async () => {
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
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
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
      </div>
    )
  }

  // /chat layout: avatar on the left, hidden on mobile
  return (
    <div className="flex gap-3 py-2 group relative">
      {/* Avatar on the left - hidden on mobile/narrow view */}
      <div className="w-12 h-12 flex-shrink-0 hidden sm:block">
        {showAvatar ? (
          shouldMakeClickable ? (
            <Link
              href={`/chat/${message.sender.username}`}
              className="block w-full h-full"
            >
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
            </Link>
          ) : (
            <Avatar className="w-full h-full">
              <AvatarFallback>
                <UserIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          )
        ) : null}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 max-w-[42rem]">
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
            {!expanded && (
              <div className="relative">
                <AssistantContentRenderer>{preview!}</AssistantContentRenderer>
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
            {expanded && (
              <div className="max-h-[60vh] overflow-y-auto rounded-md border p-3">
                <AssistantContentRenderer>
                  {message.content!}
                </AssistantContentRenderer>
              </div>
            )}
          </>
        )}

        {message.tool_calls &&
          message.tool_calls.length > 0 &&
          message.tool_calls.map(toolCall => {
            const optimisticToolCall = optimisticallyCancelled.has(toolCall.id)
              ? { ...toolCall, status: 'cancelled' as const }
              : toolCall

            return (
              <TaskResultTool
                key={toolCall.id}
                toolCall={optimisticToolCall}
                onCancel={async () => {
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
                : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
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
