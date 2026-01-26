import { LLMCallButton } from './llm-call-modal'
import { ReactionsModal } from './reactions-modal'
import { ToolHoverMenu } from './tool-hover-menu'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { hasDisplayableResults } from '@/lib/tool-results'
import { cn } from '@/lib/utils'
import { Message } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { CheckIcon, CopyIcon, HeartIcon } from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import React, { useState } from 'react'

interface ActionBarProps {
  sessionId: string
  message: Message
}

const ActionBar = ({ sessionId, message }: ActionBarProps) => {
  const { TimeAgo } = useTimeAgo()
  const { user } = useAuthState()
  const { updateReaction } = useSessionQuery({ sessionId, enabled: false })
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showReactionsModal, setShowReactionsModal] = useState(false)

  const userId = user?._id || ''

  // Reactions can be in two formats:
  // 1. Array format (from eve backend): [{ user_id, reaction }, ...]
  //    Note: user_id can be a string or ObjectId object { $oid: "..." }
  // 2. Dictionary format (from Eden API): { [userId]: [reactions...] }
  const normalizeReactions = () => {
    if (!message.reactions) return []

    if (Array.isArray(message.reactions)) {
      // Array format from eve backend
      return message.reactions.map(
        (r: { user_id: string | { $oid: string }; reaction: string }) => {
          // Handle ObjectId format { $oid: "..." } or plain string
          const id =
            typeof r.user_id === 'object' && r.user_id?.$oid
              ? r.user_id.$oid
              : String(r.user_id)
          return {
            userId: id,
            reaction: r.reaction,
          }
        },
      )
    } else {
      // Dictionary format from Eden API
      return Object.entries(message.reactions).flatMap(
        ([reactorId, reactions]) => {
          if (!Array.isArray(reactions)) return []
          return reactions.map(reaction => ({
            userId: reactorId,
            reaction: String(reaction),
          }))
        },
      )
    }
  }

  const allReactions = normalizeReactions()

  const hasHeart = userId
    ? allReactions.some(r => r.userId === userId && r.reaction === '❤️')
    : false

  // Count reactions from others (to determine if we show the count badge)
  const otherUsersReactionCount = allReactions.filter(
    r => r.userId !== userId,
  ).length

  // Session post tools that render their own badge in SessionPostEmbed
  const SESSION_POST_TOOLS = [
    'session_post',
    'abraham_publish',
    'verdelis_storyboard',
    'verdelis_draft_storyboard',
    'abraham_daily',
    'media_editor',
    'post_to_chatroom',
    'chat',
  ]

  // Get completed tool calls with results
  // Exclude session post tools and tools with child_session (they render their own badge)
  const completedToolCalls =
    message.tool_calls?.filter(toolCall => {
      const normalizedToolName = (toolCall.tool || '').trim().toLowerCase()

      return (
        toolCall.status === 'completed' &&
        hasDisplayableResults(toolCall.result) &&
        !SESSION_POST_TOOLS.includes(normalizedToolName) &&
        !toolCall.child_session
      )
    }) || []

  const handleCopy = async () => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleReaction = async (reaction: string) => {
    try {
      setIsLoading(true)

      const response = await axios.post('/api/sessions/react', {
        message_id: message._id,
        reaction,
      })

      if (response.data?.message) {
        updateReaction(response.data.message)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Error toggling reaction:',
          error.response?.data || error.message,
        )
      } else {
        console.error('Error toggling reaction:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'aui-assistant-action-bar-root flex flex-wrap items-center gap-1 md:gap-2 w-full z-10 mt-3',
        isLoading && 'opacity-50 pointer-events-none',
      )}
    >
      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon transition-colors hover:bg-gray-700/50 rounded-md p-2',
          copied && 'text-green-600',
        )}
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <CheckIcon className="w-4 h-4" />
        ) : (
          <CopyIcon className="w-4 h-4" />
        )}
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon hover:bg-gray-700/50 rounded-md p-2',
          hasHeart && 'text-red-500',
        )}
        onClick={() => toggleReaction('❤️')}
        title={hasHeart ? 'Remove heart' : 'Add heart'}
      >
        <HeartIcon
          className="w-4 h-4"
          fill={hasHeart ? 'currentColor' : 'none'}
        />
      </button>

      {otherUsersReactionCount > 0 && (
        <button
          className="aui-button aui-button-ghost text-xs px-2 py-1 hover:bg-gray-700/50 rounded-md"
          onClick={() => setShowReactionsModal(true)}
          title="View all reactions"
        >
          {allReactions.length}
        </button>
      )}

      <ReactionsModal
        open={showReactionsModal}
        onOpenChange={setShowReactionsModal}
        reactions={allReactions}
      />

      <div className="ml-auto flex flex-wrap items-center gap-2 max-w-full min-w-0 justify-end">
        {completedToolCalls.map((toolCall, index) => (
          <ToolHoverMenu
            key={`${toolCall.id}-${index}`}
            toolName={toolCall.tool!}
            args={toolCall.args}
            result={toolCall.result}
          />
        ))}
        <div
          className="text-xs bg-transparent"
          title={new Date(message.createdAt).toLocaleString()}
        >
          <TimeAgo date={new Date(message.createdAt)} />
        </div>
        {message.llm_call && <LLMCallButton llmCallId={message.llm_call} />}
      </div>
    </div>
  )
}

export default ActionBar
