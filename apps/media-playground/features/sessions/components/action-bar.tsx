import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { SessionContentMessage } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  CopyIcon,
  PinIcon,
  PinOffIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import React, { useState } from 'react'

interface ActionBarProps {
  sessionId: string
  message: SessionContentMessage
}

const ActionBar = ({ sessionId, message }: ActionBarProps) => {
  const { TimeAgo } = useTimeAgo()
  const { user } = useAuthState()
  const { updateReaction } = useSessionQuery({ sessionId, enabled: false })
  const [isLoading, setIsLoading] = useState(false)

  const userId = user?._id || ''

  const hasThumbsUp = userId
    ? message.reactions?.[userId]?.includes('thumbs_up')
    : false
  const hasThumbsDown = userId
    ? message.reactions?.[userId]?.includes('thumbs_down')
    : false
  const isPinned = userId ? message.reactions?.[userId]?.includes('pin') : false

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
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
        'aui-assistant-action-bar-root flex items-center gap-2 w-full z-10',
        isLoading && 'opacity-50 pointer-events-none',
      )}
    >
      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={handleCopy}
      >
        <CopyIcon className="w-4 h-4" />
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon',
          hasThumbsUp && 'text-green-600',
        )}
        onClick={() => toggleReaction('thumbs_up')}
      >
        <ThumbsUpIcon className="w-4 h-4" />
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon',
          hasThumbsDown && 'text-red-600',
        )}
        onClick={() => toggleReaction('thumbs_down')}
      >
        <ThumbsDownIcon className="w-4 h-4" />
      </button>

      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={() => toggleReaction('pin')}
      >
        {isPinned ? (
          <PinOffIcon className="w-4 h-4 text-purple-600" />
        ) : (
          <PinIcon className="w-4 h-4" />
        )}
      </button>

      <div
        className="ml-auto text-xs bg-transparent"
        title={new Date(message.createdAt).toLocaleString()}
      >
        <TimeAgo date={new Date(message.createdAt)} />
      </div>
    </div>
  )
}

export default ActionBar
