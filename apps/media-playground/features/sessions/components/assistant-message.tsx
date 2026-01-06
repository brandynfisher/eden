import ActionBar from './action-bar'
import { AssistantAttachmentGrid } from './assistant-attachment-grid'
import { AssistantContentRenderer } from './assistant-content-renderer'
import ToolResultActionBar from './tool-result-action-bar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskResultTool } from '@/features/sessions/components/task-result-tool'
import { ThoughtBlock } from '@/features/sessions/components/thought-block'
import TypingIndicator from '@/features/sessions/components/typing-indicator'
import { getCloudfrontUrl } from '@/lib/media'
import { hasCreationResults, hasDisplayableResults } from '@/lib/tool-results'
import { Message } from '@edenlabs/eden-sdk'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type AssistantMessageProps = {
  sessionId: string
  message: Message
  isStreamingTokens?: boolean
  showAvatar?: boolean
  isChatRoute?: boolean
  /** If provided, clicking a child session card will call this instead of navigating */
  onSessionClick?: (sessionId: string) => void
}

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

// Helper to format display name (strips discord_ prefix, shows "Moderator" for eden)
const formatDisplayName = (name?: string, username?: string) => {
  // Check if this is the moderator agent (username "eden")
  if (username?.toLowerCase() === 'eden') {
    return { displayName: 'Moderator', isDiscord: false }
  }
  const rawName = name || username || ''
  if (rawName.toLowerCase().startsWith('discord_')) {
    return { displayName: rawName.slice(8), isDiscord: true }
  }
  return { displayName: rawName, isDiscord: false }
}

export const AssistantMessage = ({
  sessionId,
  message,
  isStreamingTokens = false,
  showAvatar = true,
  isChatRoute = false,
  onSessionClick,
}: AssistantMessageProps) => {
  // Track optimistically cancelled tool calls
  const [optimisticallyCancelled, setOptimisticallyCancelled] = useState<
    Set<string>
  >(new Set())
  const [expanded, setExpanded] = useState(false)
  const trimmedContent = message.content?.trim() ?? ''
  const contentLen = trimmedContent.length
  const isHuge = contentLen > 40000
  const previewLimit = 8000
  const preview = isHuge
    ? trimmedContent.slice(0, previewLimit)
    : trimmedContent

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

  const isEmpty = trimmedContent.length === 0
  const profileIdentifier =
    message.sender?.username || message.sender?._id || ''
  const shouldMakeClickable = !!profileIdentifier

  const finalImageUrl = message.sender?.userImage
    ? message.sender.userImage.startsWith('https://')
      ? message.sender.userImage
      : getCloudfrontUrl(message.sender.userImage)
    : undefined

  // Format display name (strips discord_ prefix)
  const { displayName, isDiscord } = formatDisplayName(
    message.sender?.name,
    message.sender?.username,
  )

  // Different layouts for /chat vs /sessions
  if (!isChatRoute) {
    // /sessions layout: compact on mobile, avatar on left on desktop
    return (
      <div className="py-2 group relative ml-0 pl-0">
        {/* Mobile: Avatar, name, and content */}
        <div className="sm:hidden">
          {showAvatar && (
            <div className="flex items-center gap-2 mb-2 mt-3">
              {shouldMakeClickable ? (
                <Link
                  href={`/agents/${profileIdentifier}`}
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
              {displayName && (
                <span className="text-xs font-medium uppercase text-muted-foreground tracking-wide inline-flex items-center gap-1">
                  {displayName}
                  {isDiscord && <DiscordIcon className="w-3 h-3" />}
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
                      {trimmedContent}
                    </AssistantContentRenderer>
                  </div>
                )}
              </>
            )}

            {hasAttachments && (
              <AssistantAttachmentGrid
                attachments={message.attachments!}
                messageId={message._id}
              />
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
                    messageId={message._id}
                    onSessionClick={onSessionClick}
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
                      hasDisplayableResults(toolCall.result),
                  )
                    ? 'opacity-100'
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                }`}
              >
                {message.tool_calls?.some(
                  toolCall =>
                    toolCall.status === 'completed' &&
                    hasCreationResults(toolCall.result),
                ) ? (
                  <ToolResultActionBar message={message} />
                ) : (
                  <ActionBar sessionId={sessionId} message={message} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Use flexbox layout for reliable avatar positioning */}
        <div className="hidden sm:flex gap-3 items-start ml-0 pl-0">
          {/* Avatar column - fixed width, explicit no margin */}
          <div className="w-12 h-12 flex-shrink-0 ml-0 pl-0">
            {showAvatar ? (
              shouldMakeClickable ? (
                <Link
                  href={`/agents/${profileIdentifier}`}
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

          {/* Content column - flexible width */}
          <div className="flex-1 min-w-0">
            {/* Sender name - desktop */}
            {showAvatar && displayName && (
              <span className="text-xs font-medium uppercase text-muted-foreground tracking-wide mb-1 inline-flex items-center gap-1">
                {displayName}
                {isDiscord && <DiscordIcon className="w-3 h-3" />}
              </span>
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
                        {trimmedContent}
                      </AssistantContentRenderer>
                    </div>
                  )}
                </>
              )}

              {hasAttachments && (
                <AssistantAttachmentGrid
                  attachments={message.attachments!}
                  messageId={message._id}
                />
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
                      messageId={message._id}
                      onSessionClick={onSessionClick}
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
                        hasDisplayableResults(toolCall.result),
                    )
                      ? 'opacity-100'
                      : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                  }`}
                >
                  {message.tool_calls?.some(
                    toolCall =>
                      toolCall.status === 'completed' &&
                      hasCreationResults(toolCall.result),
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
              href={`/agents/${profileIdentifier}`}
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
        {/* Sender name */}
        {showAvatar && displayName && (
          <span className="text-xs font-medium uppercase text-muted-foreground tracking-wide mb-1 inline-flex items-center gap-1">
            {displayName}
            {isDiscord && <DiscordIcon className="w-3 h-3" />}
          </span>
        )}
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
                  {trimmedContent}
                </AssistantContentRenderer>
              </div>
            )}
          </>
        )}

        {hasAttachments && (
          <AssistantAttachmentGrid
            attachments={message.attachments!}
            messageId={message._id}
          />
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
                messageId={message._id}
                onSessionClick={onSessionClick}
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
                  hasDisplayableResults(toolCall.result),
              )
                ? 'opacity-100'
                : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
            }`}
          >
            {message.tool_calls?.some(
              toolCall =>
                toolCall.status === 'completed' &&
                hasCreationResults(toolCall.result),
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
