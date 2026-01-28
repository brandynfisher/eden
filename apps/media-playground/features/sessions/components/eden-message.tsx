'use client'

import { LLMCallButton } from './llm-call-modal'
import { MessageAttachment } from './message-attachment'
import { LightboxGallery } from '@/components/media/lightbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent, Message } from '@edenlabs/eden-sdk'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Lock,
  Trophy,
  UserIcon,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React, { useState } from 'react'

interface EdenMessageProps {
  message: Message
  agents?: Agent[]
  /** Show moderator messages (and legacy conductor messages for backwards compatibility) */
  showModeratorMessages?: boolean
  /** Whether to show the avatar (for grouping consecutive messages) */
  showAvatar?: boolean
}

// Parsed content types
type ConductorFinishContent = {
  summary?: string
  outcome?: string
}

type ConductorTurnContent = {
  reasoning?: string
  speaker?: string
  hint?: string | null
  finish?: boolean
}

type AgentContext = {
  agent_username: string
  context: string
}

type ConductorInitContent = {
  shared_understanding?: string
  agent_contexts?: AgentContext[]
}

type Vote = {
  voter: string
  choice: string
  reasoning?: string
}

type ModeratorVoteContent = {
  topic?: string
  choices?: string[]
  voters?: string[]
  votes?: Vote[]
}

type ModeratorPromptContent = {
  agent?: string
  hint?: string
}

// Helper to truncate text to ~N words
function truncateToWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/)
  if (words.length <= wordCount) return text
  return words.slice(0, wordCount).join(' ')
}

// Helper to get agent by username
function getAgentByUsername(
  agents: Agent[] | undefined,
  username: string,
): Agent | undefined {
  if (!agents) return undefined
  return agents.find(
    a =>
      a.username?.toLowerCase() === username.toLowerCase() ||
      a.name?.toLowerCase() === username.toLowerCase(),
  )
}

// Small agent avatar component
function SmallAgentAvatar({
  agent,
  username,
  className,
}: {
  agent?: Agent
  username?: string
  className?: string
}) {
  const imageUrl = agent?.userImage
    ? agent.userImage.startsWith('https://')
      ? agent.userImage
      : getCloudfrontUrl(agent.userImage)
    : undefined

  const displayName = agent?.name || username || '?'
  const fallbackLetter = displayName.charAt(0).toUpperCase()

  return (
    <Avatar className={cn('h-6 w-6 shrink-0', className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={displayName} />}
      <AvatarFallback className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
        {fallbackLetter}
      </AvatarFallback>
    </Avatar>
  )
}

// Expandable text component
function ExpandableText({
  text,
  previewWordCount = 20,
  className,
}: {
  text: string
  previewWordCount?: number
  className?: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const words = text.split(/\s+/)
  const needsTruncation = words.length > previewWordCount

  if (!needsTruncation) {
    return <span className={className}>{text}</span>
  }

  const preview = truncateToWords(text, previewWordCount)

  return (
    <span className={className}>
      {isExpanded ? text : preview}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 ml-1 inline-flex items-center"
      >
        {isExpanded ? (
          <>
            <span className="text-xs">[collapse]</span>
          </>
        ) : (
          <>
            <span className="text-xs">...</span>
          </>
        )}
      </button>
    </span>
  )
}

// CONDUCTOR FINISH component
function ConductorFinishMessage({
  content,
  message,
  TimeAgo,
}: {
  content: ConductorFinishContent
  message: Message
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  const [showSummary, setShowSummary] = useState(false)

  return (
    <div className="pt-1 pb-3 group">
      <div className="max-w-[42rem]">
        <div className="text-[0.62rem] font-medium text-amber-600/70 dark:text-amber-400/60 mb-1 px-1 flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          OUTCOME
        </div>
        <div
          onClick={() => content.summary && setShowSummary(!showSummary)}
          className={cn(
            'bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-lg px-4 py-3',
            content.summary &&
              'cursor-pointer hover:bg-amber-50/80 dark:hover:bg-amber-900/20 transition-colors',
          )}
        >
          {/* Outcome - prominent display */}
          {content.outcome && (
            <div className="text-base text-amber-900 dark:text-amber-100 font-medium">
              {content.outcome}
            </div>
          )}

          {/* Summary - expandable */}
          {content.summary && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-amber-600/70 dark:text-amber-400/50">
                {showSummary ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                view summary
              </div>
              {showSummary && (
                <div className="mt-2 text-sm text-amber-800/70 dark:text-amber-200/60 leading-relaxed">
                  {content.summary}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// CONDUCTOR TURN component
function ConductorTurnMessage({
  content,
  message,
  agents,
  TimeAgo,
}: {
  content: ConductorTurnContent
  message: Message
  agents?: Agent[]
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const speakerAgent = content.speaker
    ? getAgentByUsername(agents, content.speaker)
    : undefined

  // Check if reasoning needs truncation
  const reasoning = content.reasoning || ''
  const needsTruncation = reasoning.split(/\s+/).length > 20

  return (
    <div className="pt-1 pb-3 group">
      <div className="max-w-[42rem]">
        <div className="text-[0.62rem] font-medium text-blue-600/50 dark:text-blue-400/50 mb-1 px-1">
          CONDUCTOR TURN
        </div>
        <div
          onClick={() => needsTruncation && setIsExpanded(!isExpanded)}
          className={cn(
            'bg-blue-100/40 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-3 space-y-2',
            needsTruncation &&
              'cursor-pointer hover:bg-blue-100/60 dark:hover:bg-blue-900/25 transition-colors',
          )}
        >
          {/* Reasoning - truncated with expand */}
          {content.reasoning && (
            <div className="text-sm text-blue-900/70 dark:text-blue-100/60">
              {isExpanded ? reasoning : truncateToWords(reasoning, 20)}
              {needsTruncation && !isExpanded && (
                <span className="text-blue-500 dark:text-blue-400 ml-1">
                  ...
                </span>
              )}
            </div>
          )}

          {/* Speaker + Hint row - hide speaker if finish is true */}
          {((!content.finish && content.speaker) || content.hint) && (
            <div className="flex items-center gap-2 pt-1">
              {!content.finish && content.speaker && (
                <>
                  <span className="text-xs font-medium text-blue-600/70 dark:text-blue-400/60">
                    Next:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <SmallAgentAvatar
                      agent={speakerAgent}
                      username={content.speaker}
                    />
                    <span className="text-xs font-medium text-blue-800/80 dark:text-blue-200/80">
                      {speakerAgent?.name || content.speaker}
                    </span>
                  </div>
                </>
              )}
              {content.hint && (
                <span className="text-xs text-blue-700/60 dark:text-blue-300/50 italic">
                  &ldquo;{content.hint}&rdquo;
                </span>
              )}
            </div>
          )}

          {/* Expand/collapse indicator */}
          {needsTruncation && (
            <div className="flex items-center gap-1 text-xs text-blue-600/50 dark:text-blue-400/40">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {isExpanded ? 'collapse' : 'expand'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// CONDUCTOR INIT component
function ConductorInitMessage({
  content,
  message,
  agents,
  TimeAgo,
}: {
  content: ConductorInitContent
  message: Message
  agents?: Agent[]
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  return (
    <div className="pt-1 pb-3 group">
      <div className="max-w-[42rem]">
        <div className="bg-blue-100/40 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-3 space-y-3">
          {/* Shared understanding - truncated with expand */}
          {content.shared_understanding && (
            <div className="text-sm text-blue-900/70 dark:text-blue-100/60">
              <ExpandableText
                text={content.shared_understanding}
                previewWordCount={20}
              />
            </div>
          )}

          {/* Agent contexts */}
          {content.agent_contexts && content.agent_contexts.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-blue-200/30 dark:border-blue-700/20">
              {content.agent_contexts.map((agentCtx, idx) => {
                const agent = getAgentByUsername(
                  agents,
                  agentCtx.agent_username,
                )
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <SmallAgentAvatar
                      agent={agent}
                      username={agentCtx.agent_username}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-blue-800/80 dark:text-blue-200/80">
                        {agent?.name || agentCtx.agent_username}
                      </span>
                      <div className="text-xs text-blue-700/60 dark:text-blue-300/50 mt-0.5">
                        <ExpandableText
                          text={agentCtx.context}
                          previewWordCount={25}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// MODERATOR VOTE component - displays voting results with avatars
function ModeratorVoteMessage({
  content,
  message,
  agents,
  TimeAgo,
}: {
  content: ModeratorVoteContent
  message: Message
  agents?: Agent[]
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  const [expandedVotes, setExpandedVotes] = useState<Set<number>>(new Set())
  const REASONING_CHAR_LIMIT = 100

  const toggleExpanded = (index: number) => {
    setExpandedVotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const votes = content.votes || []

  return (
    <div className="pt-1 pb-3 group">
      <div className="max-w-[42rem]">
        <div className="text-[0.62rem] font-medium text-purple-600/70 dark:text-purple-400/60 mb-1 px-1 flex items-center gap-1">
          <Users className="h-3 w-3" />
          VOTE RESULTS
        </div>
        <div className="bg-purple-50/60 dark:bg-purple-900/10 border border-purple-200/50 dark:border-purple-700/30 rounded-lg px-4 py-3">
          {/* Topic */}
          {content.topic && (
            <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
              {content.topic}
            </div>
          )}

          {/* Votes */}
          <div className="space-y-3">
            {votes.map((vote, idx) => {
              const voterAgent = getAgentByUsername(agents, vote.voter)
              const isExpanded = expandedVotes.has(idx)
              const hasLongReasoning =
                vote.reasoning && vote.reasoning.length > REASONING_CHAR_LIMIT

              return (
                <div key={idx} className="flex items-start gap-3">
                  {/* Voter avatar */}
                  <SmallAgentAvatar
                    agent={voterAgent}
                    username={vote.voter}
                    className="mt-0.5"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Voter name and choice */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-purple-800/80 dark:text-purple-200/80">
                        {voterAgent?.name || vote.voter}
                      </span>
                      <span className="text-xs text-purple-600/60 dark:text-purple-400/50">
                        voted for
                      </span>
                      <span className="text-sm font-semibold text-purple-900 dark:text-purple-100 bg-purple-200/50 dark:bg-purple-700/30 px-2 py-0.5 rounded">
                        {vote.choice}
                      </span>
                    </div>

                    {/* Reasoning (if present) */}
                    {vote.reasoning && (
                      <div className="mt-1 text-xs text-purple-700/60 dark:text-purple-300/50 italic">
                        {hasLongReasoning && !isExpanded ? (
                          <>
                            {vote.reasoning.slice(0, REASONING_CHAR_LIMIT)}
                            <button
                              onClick={() => toggleExpanded(idx)}
                              className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 ml-1 not-italic"
                            >
                              ...more
                            </button>
                          </>
                        ) : (
                          <>
                            {vote.reasoning}
                            {hasLongReasoning && (
                              <button
                                onClick={() => toggleExpanded(idx)}
                                className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 ml-1 not-italic"
                              >
                                [less]
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// MODERATOR PROMPT component - displays the prompt sent to a specific agent
function ModeratorPromptMessage({
  content,
  message,
  agents,
  TimeAgo,
}: {
  content: ModeratorPromptContent
  message: Message
  agents?: Agent[]
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  const targetAgent = content.agent
    ? getAgentByUsername(agents, content.agent)
    : undefined

  return (
    <div className="pt-1 pb-3 group">
      <div className="max-w-[42rem]">
        <div className="text-[0.62rem] font-medium text-blue-600/50 dark:text-blue-400/50 mb-1 px-1">
          NEXT UP
        </div>
        <div className="bg-blue-100/40 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-3">
          {/* Target agent */}
          <div className="flex items-center gap-2">
            <SmallAgentAvatar agent={targetAgent} username={content.agent} />
            <span className="text-sm font-medium text-blue-800/80 dark:text-blue-200/80">
              {targetAgent?.name || content.agent}
            </span>
          </div>

          {/* Hint/prompt */}
          {content.hint && (
            <div className="mt-2 text-sm text-blue-900/70 dark:text-blue-100/60 italic">
              &ldquo;{content.hint}&rdquo;
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// Default conductor message (trigger, conductor_hint, or fallback)
function DefaultConductorMessage({
  label,
  content,
  message,
  TimeAgo,
}: {
  label: string
  content: string
  message: Message
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Try to parse and pretty-print JSON content
  let displayContent = content
  try {
    const parsed = JSON.parse(content)
    displayContent = JSON.stringify(parsed, null, 2)
  } catch {
    displayContent = content
  }

  // Check if content needs truncation (more than ~20 words or 150 chars)
  const needsTruncation =
    displayContent.split(/\s+/).length > 20 || displayContent.length > 150
  const truncatedContent = needsTruncation
    ? truncateToWords(displayContent, 20)
    : displayContent

  return (
    <div className="pt-1 pb-3 group">
      <div className="max-w-[42rem]">
        <div className="text-[0.62rem] font-medium text-blue-600/50 dark:text-blue-400/50 mb-1 px-1">
          {label}
        </div>
        <div
          onClick={() => needsTruncation && setIsExpanded(!isExpanded)}
          className={cn(
            'bg-blue-100/40 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-3',
            needsTruncation &&
              'cursor-pointer hover:bg-blue-100/60 dark:hover:bg-blue-900/25 transition-colors',
          )}
        >
          <div className="text-sm text-blue-900/70 dark:text-blue-100/60">
            <pre className="whitespace-pre-wrap font-sans">
              {isExpanded ? displayContent : truncatedContent}
              {needsTruncation && !isExpanded && (
                <span className="text-blue-500 dark:text-blue-400 ml-1">
                  ...
                </span>
              )}
            </pre>
          </div>
          {needsTruncation && (
            <div className="flex items-center gap-1 text-xs text-blue-600/50 dark:text-blue-400/40 mt-2">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {isExpanded ? 'collapse' : 'expand'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// PRIVATE MESSAGE component - displays agent-to-agent private messages
// Styled to match normal messages with avatar on left, content stacked on right
function PrivateMessageDisplay({
  message,
  TimeAgo,
}: {
  message: Message
  TimeAgo: ReturnType<typeof useTimeAgo>['TimeAgo']
}) {
  const { eden_message_data } = message
  const recipients = eden_message_data?.agents || []

  // Use message.sender consistently (same as AssistantMessage)
  const sender = message.sender
  const senderImageUrl = sender?.userImage
    ? sender.userImage.startsWith('https://')
      ? sender.userImage
      : getCloudfrontUrl(sender.userImage)
    : undefined

  // Show "Moderator" if sender username is "eden"
  const isEdenSender = sender?.username?.toLowerCase() === 'eden'
  const senderName = isEdenSender ? 'Moderator' : sender?.name || 'Unknown'
  const recipientNames = recipients.map(r => r.name).join(', ')
  const profileIdentifier = sender?.username || sender?._id || ''
  const shouldMakeClickable = !!profileIdentifier

  return (
    <div className="flex gap-3 py-2 px-2 group">
      {/* Avatar - left column */}
      <div className="flex-shrink-0">
        {shouldMakeClickable ? (
          <Link href={`/agents/${profileIdentifier}`}>
            <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={senderImageUrl} />
              <AvatarFallback>
                <UserIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="w-12 h-12">
            <AvatarImage src={senderImageUrl} />
            <AvatarFallback>
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Right column - name, private indicator, content stacked */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {shouldMakeClickable ? (
            <Link
              href={`/agents/${profileIdentifier}`}
              className="hover:underline"
            >
              {senderName}
            </Link>
          ) : (
            senderName
          )}
        </div>

        {/* Private indicator */}
        <div className="flex items-center gap-1 text-red-500/70 dark:text-red-400/70 mt-0.5">
          <Lock className="h-3 w-3" />
          <span className="text-xs">to {recipientNames}</span>
        </div>

        {/* Attachments (images, etc.) */}
        {message.attachments && message.attachments.length > 0 && (
          <LightboxGallery galleryKey={message._id}>
            <div className="flex flex-wrap gap-2 mt-2 mb-1">
              {message.attachments.map((attachment, index) => (
                <MessageAttachment
                  key={attachment}
                  url={attachment}
                  index={index}
                />
              ))}
            </div>
          </LightboxGallery>
        )}

        {/* Content */}
        {message.content && (
          <div className="text-foreground leading-relaxed mt-1">
            {message.content}
          </div>
        )}

        {/* Timestamp and metadata */}
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    </div>
  )
}

// Wrapper component for orchestrator messages with avatar display
// Avatar on left, content stacked vertically on right
function OrchestratorMessageWrapper({
  children,
  showAvatar = true,
  message,
}: {
  children: React.ReactNode
  showAvatar?: boolean
  message: Message
}) {
  // Use message.sender consistently (same as AssistantMessage)
  const sender = message.sender
  const senderImageUrl = sender?.userImage
    ? sender.userImage.startsWith('https://')
      ? sender.userImage
      : getCloudfrontUrl(sender.userImage)
    : undefined

  const profileIdentifier = sender?.username || sender?._id || 'eden'
  const shouldMakeClickable = !!profileIdentifier

  return (
    <div className="flex gap-3 py-2 px-2 group">
      {/* Avatar - left column */}
      <div className="w-12 flex-shrink-0">
        {showAvatar ? (
          shouldMakeClickable ? (
            <Link href={`/agents/${profileIdentifier}`}>
              <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={senderImageUrl} />
                <AvatarFallback>
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                <UserIcon className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          )
        ) : null}
      </div>

      {/* Right column - name and content stacked */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {shouldMakeClickable ? (
              <Link
                href={`/agents/${profileIdentifier}`}
                className="hover:underline"
              >
                MODERATOR
              </Link>
            ) : (
              'MODERATOR'
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export const EdenMessage = ({
  message,
  agents,
  showModeratorMessages = false,
  showAvatar = true,
}: EdenMessageProps) => {
  const { eden_message_data, content } = message
  const { TimeAgo } = useTimeAgo()

  // Handle conductor and moderator message types (moderator is the new version, conductor is legacy)
  const orchestratorTypes = [
    'trigger',
    // Legacy conductor types
    'conductor_init',
    'conductor_turn',
    'conductor_hint',
    'conductor_finish',
    // New moderator types
    'moderator_start',
    'moderator_prompt',
    'moderator_vote',
    'moderator_finish',
  ]

  // Types to hide when moderator toggle is off
  // Always show: conductor_init, conductor_finish, moderator_start, moderator_finish
  // Hide when toggle off: conductor_turn, conductor_hint, moderator_prompt, moderator_vote
  const hiddenWhenToggleOff = [
    'conductor_turn',
    'conductor_hint',
    'moderator_prompt',
    'moderator_vote',
  ]

  // Hide certain types if toggle is off
  if (
    !showModeratorMessages &&
    eden_message_data?.message_type &&
    hiddenWhenToggleOff.includes(eden_message_data.message_type)
  ) {
    return null
  }

  if (
    eden_message_data?.message_type &&
    orchestratorTypes.includes(eden_message_data.message_type) &&
    content
  ) {
    const trimmedContent = content.trim()
    const messageType = eden_message_data.message_type

    // Try to parse JSON content
    let parsedContent: unknown = null
    try {
      parsedContent = JSON.parse(trimmedContent)
    } catch {
      // Try again with single quotes replaced (backend sometimes uses single quotes)
      try {
        // Replace single quotes with double quotes for JSON values
        const fixedContent = trimmedContent.replace(/'/g, '"')
        parsedContent = JSON.parse(fixedContent)
      } catch {
        // Not JSON, will use default display
      }
    }

    // Build the orchestrator content based on message type
    let orchestratorContent: React.ReactNode = null

    // CONDUCTOR_FINISH or MODERATOR_FINISH - special display with outcome + expandable summary
    if (
      (String(messageType) === 'conductor_finish' ||
        String(messageType) === 'moderator_finish') &&
      parsedContent
    ) {
      orchestratorContent = (
        <ConductorFinishMessage
          content={parsedContent as ConductorFinishContent}
          message={message}
          TimeAgo={TimeAgo}
        />
      )
    }
    // CONDUCTOR_TURN - reasoning (truncated) + speaker avatar + hint
    else if (String(messageType) === 'conductor_turn' && parsedContent) {
      orchestratorContent = (
        <ConductorTurnMessage
          content={parsedContent as ConductorTurnContent}
          message={message}
          agents={agents}
          TimeAgo={TimeAgo}
        />
      )
    }
    // CONDUCTOR_INIT or MODERATOR_START - shared understanding + agent contexts
    else if (
      (String(messageType) === 'conductor_init' ||
        String(messageType) === 'moderator_start') &&
      parsedContent
    ) {
      orchestratorContent = (
        <ConductorInitMessage
          content={parsedContent as ConductorInitContent}
          message={message}
          agents={agents}
          TimeAgo={TimeAgo}
        />
      )
    }
    // MODERATOR_VOTE - voting results with avatars
    else if (String(messageType) === 'moderator_vote' && parsedContent) {
      orchestratorContent = (
        <ModeratorVoteMessage
          content={parsedContent as ModeratorVoteContent}
          message={message}
          agents={agents}
          TimeAgo={TimeAgo}
        />
      )
    }
    // MODERATOR_PROMPT - prompt sent to a specific agent
    else if (String(messageType) === 'moderator_prompt' && parsedContent) {
      orchestratorContent = (
        <ModeratorPromptMessage
          content={parsedContent as ModeratorPromptContent}
          message={message}
          agents={agents}
          TimeAgo={TimeAgo}
        />
      )
    }
    // Default display for trigger, conductor_hint, or unparseable content
    else {
      const labelMap: Record<string, string> = {
        trigger: 'TASK',
        conductor_init: 'MODERATOR',
        conductor_turn: 'CONDUCTOR TURN',
        conductor_hint: 'CONDUCTOR HINT',
        conductor_finish: 'CONDUCTOR FINISH',
        moderator_start: 'MODERATOR',
        moderator_prompt: 'MODERATOR PROMPT',
        moderator_vote: 'MODERATOR VOTE',
        moderator_finish: 'MODERATOR FINISH',
      }
      const label = labelMap[messageType] || 'EDEN'

      orchestratorContent = (
        <DefaultConductorMessage
          label={label}
          content={trimmedContent}
          message={message}
          TimeAgo={TimeAgo}
        />
      )
    }

    // Wrap orchestrator content with avatar display
    return (
      <OrchestratorMessageWrapper showAvatar={showAvatar} message={message}>
        {orchestratorContent}
      </OrchestratorMessageWrapper>
    )
  }

  if (!eden_message_data) return null

  const { message_type, agents: messageAgents, error } = eden_message_data

  if (message_type === 'rate_limit') {
    const errorText =
      error || message.content || "You're sending messages too quickly."

    return (
      <div className="flex flex-col items-center py-2 group">
        <Alert
          variant="destructive"
          className="max-w-[42rem] w-full items-start"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <AlertDescription className="text-sm">{errorText}</AlertDescription>
        </Alert>
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="text-xs text-muted-foreground"
            title={new Date(message.createdAt).toLocaleString()}
          >
            <TimeAgo date={new Date(message.createdAt)} />
          </div>
          <LLMCallButton
            llmCallId={message.llm_call}
            observability={message.observability || null}
          />
        </div>
      </div>
    )
  }

  // Handle private messages
  if (message_type === 'private_message') {
    return <PrivateMessageDisplay message={message} TimeAgo={TimeAgo} />
  }

  const isAgentAdd = message_type === 'agent_add'
  const isAgentRemove = message_type === 'agent_remove'

  if (!messageAgents || messageAgents.length === 0) return null

  const agentNames = messageAgents.map(agent => agent.name).join(', ')
  const Icon = isAgentAdd ? UserPlus : isAgentRemove ? UserMinus : Users

  let text = ''
  if (isAgentAdd) {
    text = `Added ${agentNames}`
  } else if (isAgentRemove) {
    text = `Removed ${agentNames}`
  }

  return (
    <div className="flex flex-col items-center py-2 group">
      <div className="inline-flex max-w-full min-w-0 items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
        <Icon className="w-3 h-3 shrink-0" />
        <span className="truncate">{text}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          className="text-xs text-muted-foreground"
          title={new Date(message.createdAt).toLocaleString()}
        >
          <TimeAgo date={new Date(message.createdAt)} />
        </div>
        <LLMCallButton
          llmCallId={message.llm_call}
          observability={message.observability || null}
        />
      </div>
    </div>
  )
}
