import { LLMCallButton } from './llm-call-modal'
import { ToolHoverMenu } from './tool-hover-menu'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { Message, TaskV2Result } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
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

  const userId = user?._id || ''

  const hasThumbsUp = userId
    ? message.reactions?.[userId]?.includes('thumbs_up')
    : false
  const hasThumbsDown = userId
    ? message.reactions?.[userId]?.includes('thumbs_down')
    : false

  // Session post tools that render their own badge in SessionPostEmbed
  const SESSION_POST_TOOLS = [
    'session_post',
    'abraham_publish',
    'verdelis_storyboard',
    'verdelis_draft_storyboard',
    'abraham_daily',
    'media_editor',
    'post_to_chatroom',
  ]

  // Get completed tool calls with results
  // Exclude session post tools and tools with child_session (they render their own badge)
  const completedToolCalls =
    message.tool_calls?.filter(toolCall => {
      const normalizedToolName = (toolCall.tool || '').trim().toLowerCase()

      return (
        toolCall.status === 'completed' &&
        toolCall.result &&
        (toolCall.result as TaskV2Result[]).length > 0 &&
        toolCall.result.some(
          (result: TaskV2Result) =>
            result &&
            (Array.isArray(result?.output) ||
              (typeof result?.output === 'string' &&
                (result?.output as string).length > 0)),
        ) &&
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

      updateReaction(response.data.message)
    } catch (error) {
      console.error('Error toggling reaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'aui-assistant-action-bar-root flex items-center gap-1 w-full z-10 mt-3',
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
          hasThumbsUp && 'text-green-600',
        )}
        onClick={() => toggleReaction('thumbs_up')}
      >
        <ThumbsUpIcon className="w-4 h-4" />
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon hover:bg-gray-700/50 rounded-md p-2',
          hasThumbsDown && 'text-red-600',
        )}
        onClick={() => toggleReaction('thumbs_down')}
      >
        <ThumbsDownIcon className="w-4 h-4" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        {completedToolCalls.map((toolCall, index) => (
          <ToolHoverMenu
            key={`${toolCall.id}-${index}`}
            toolName={toolCall.tool!}
            args={toolCall.args}
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
