import { ToolHoverMenu } from './tool-hover-menu'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useToggleLikeQuery } from '@/hooks/query/use-toggle-like-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { downloadFile } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  updateAddToCollectionModal,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { generateFilename } from '@/utils/slug.util'
import { Message } from '@edenlabs/eden-sdk'
import {
  BookmarkPlusIcon,
  DownloadIcon,
  ExternalLinkIcon,
  HeartIcon,
  Share2Icon,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

interface ToolResultActionBarProps {
  message: Message
}

// Individual action button for tool results
const ToolActionButton = ({ creationId }: { creationId: string }) => {
  const { isSignedIn } = useAuthState()
  const dispatch = useAppDispatch()
  const { creation, isLoading } = useCreationQuery({
    key: creationId,
    enabled: !!creationId,
  })

  const { toggleLike, isPending } = useToggleLikeQuery({
    isLiked: creation?.isLiked || false,
    entityType: 'creation',
    entityId: creationId,
  })

  const handleAddToCollectionClick = () => {
    dispatch(
      updateAddToCollectionModal({
        isOpen: true,
        creationIds: [creationId],
      }),
    )
  }

  const handleShareClick = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/creations/${creationId}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl: shareUrl,
      }),
    )
  }

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading && creation) {
      await toggleLike()
    }
  }

  const handleDownloadClick = async () => {
    if (creation?.filename) {
      const saveAsFileName = generateFilename(
        creation.user?.username || '',
        creation.task?.args?.prompt?.substring(0, 64).trim() || '',
        creation._id || '',
      )

      await downloadFile(
        getCloudfrontOriginalUrl(creation.filename),
        `Eden_creation_${saveAsFileName}`,
      )

      toast.info(`Downloading...`, {
        description: `creation: ${saveAsFileName}`,
        dismissible: true,
        richColors: true,
        duration: 500,
      })
    }
  }

  // Show loading state or fallback if creation not loaded
  if (isLoading || !creation) {
    return null
  }

  return (
    <>
      <Link
        href={`/creations/${creationId}`}
        className="aui-button aui-button-ghost aui-button-icon"
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </Link>

      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={handleShareClick}
      >
        <Share2Icon className="w-4 h-4" />
      </button>

      <button
        className={cn(
          'aui-button aui-button-ghost aui-button-icon',
          creation.isLiked && 'text-red-500',
        )}
        onClick={handleLikeClick}
        disabled={!isSignedIn || isPending}
      >
        <HeartIcon
          className="w-4 h-4"
          fill={creation.isLiked ? 'currentColor' : 'none'}
        />
      </button>

      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={handleAddToCollectionClick}
        disabled={!isSignedIn}
      >
        <BookmarkPlusIcon className="w-4 h-4" />
      </button>

      <button
        className="aui-button aui-button-ghost aui-button-icon"
        onClick={handleDownloadClick}
      >
        <DownloadIcon className="w-4 h-4" />
      </button>
    </>
  )
}

const ToolResultActionBar = ({ message }: ToolResultActionBarProps) => {
  const { TimeAgo } = useTimeAgo()

  // Get completed tool calls with results that have creation IDs
  const completedToolCallsWithCreations =
    message.tool_calls?.filter(
      toolCall =>
        toolCall.status === 'completed' &&
        toolCall.result &&
        toolCall.result.length > 0 &&
        toolCall.result.some(
          result =>
            result &&
            Array.isArray(result?.output) &&
            result.output.some(output => output.creation),
        ),
    ) || []

  // Get all creation IDs from completed tool calls
  const creationIds = completedToolCallsWithCreations.flatMap(
    toolCall =>
      toolCall.result?.flatMap(result =>
        Array.isArray(result?.output)
          ? result.output
              .filter(output => output.creation)
              .map(output => output.creation.$oid || output.creation)
          : [],
      ) || [],
  )

  // Use the first creation ID for the action buttons
  const primaryCreationId = creationIds[0]

  return (
    <div className="aui-assistant-action-bar-root flex items-center gap-2 w-full z-10">
      {primaryCreationId && <ToolActionButton creationId={primaryCreationId} />}

      <div className="ml-auto flex items-center gap-2">
        {completedToolCallsWithCreations.map((toolCall, index) => (
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
      </div>
    </div>
  )
}

export default ToolResultActionBar
