import { pinMessage, unpinMessage } from '@/features/chat/chat-api'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import {
  CopyIcon,
  PinIcon,
  PinOffIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import React, { type FC, useState } from 'react'

interface ActionBarProps {
  id: string
  createdAt: string
  pinned?: boolean
  reactions?: {
    thumbs_up?: string[]
    thumbs_down?: string[]
  }
  onCopy?: () => void
  onFeedbackPositive?: () => void
  onFeedbackNegative?: () => void
}

const ActionBar: FC<ActionBarProps> = ({
  id,
  createdAt,
  pinned: initialPinned = false,
  reactions = {},
  onCopy,
  onFeedbackPositive,
  onFeedbackNegative,
}) => {
  const { TimeAgo } = useTimeAgo()
  const [pinnedState, setPinnedState] = useState(initialPinned)
  const { user } = useAuthState()
  const userId = user?._id || null

  const hasThumbsUp = userId ? reactions.thumbs_up?.includes(userId) : false
  const hasThumbsDown = userId ? reactions.thumbs_down?.includes(userId) : false

  return (
    <div className="aui-assistant-action-bar-root flex items-center gap-2 w-full z-10">
      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={onCopy}
      >
        <CopyIcon className="w-4 h-4" />
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon',
          hasThumbsUp && 'text-green-600',
        )}
        onClick={onFeedbackPositive}
      >
        <ThumbsUpIcon className="w-4 h-4" />
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon',
          hasThumbsDown && 'text-red-600',
        )}
        onClick={onFeedbackNegative}
      >
        <ThumbsDownIcon className="w-4 h-4" />
      </button>

      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={async () => {
          if (pinnedState) {
            await unpinMessage(id)
            setPinnedState(false)
          } else {
            await pinMessage(id)
            setPinnedState(true)
          }
        }}
      >
        {pinnedState ? (
          <PinOffIcon className="w-4 h-4 text-purple-600" />
        ) : (
          <PinIcon className="w-4 h-4" />
        )}
      </button>

      <div
        className="ml-auto text-xs bg-transparent"
        title={new Date(createdAt).toLocaleString()}
      >
        <TimeAgo date={new Date(createdAt)} />
      </div>
    </div>
  )
}

export default ActionBar
