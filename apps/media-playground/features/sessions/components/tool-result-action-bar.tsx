import { LLMCallButton } from './llm-call-modal'
import { ToolHoverMenu } from './tool-hover-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useToggleLikeQuery } from '@/hooks/query/use-toggle-like-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { downloadFile } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { normalizeToolResults } from '@/lib/tool-results'
import { cn } from '@/lib/utils'
import {
  updateAddToCollectionModal,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { generateFilename } from '@/utils/slug.util'
import { Message, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import {
  BookmarkPlusIcon,
  DownloadIcon,
  ExternalLinkIcon,
  HeartIcon,
  Share2Icon,
} from 'lucide-react'
// import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

interface ToolResultActionBarProps {
  message: Message
}

// Individual action button for tool results
export const ToolActionButton = ({ creationId }: { creationId: string }) => {
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
    <TooltipProvider>
      <div className="inline-flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/creations/${creationId}`}
              className="aui-button aui-button-ghost aui-button-icon"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Open creation page</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="aui-button aui-button-ghost aui-button-icon"
              onClick={handleShareClick}
            >
              <Share2Icon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            {creation.isLiked ? 'Unlike' : 'Like'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="aui-button aui-button-ghost aui-button-icon"
              onClick={handleAddToCollectionClick}
              disabled={!isSignedIn}
            >
              <BookmarkPlusIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Add to collection</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="aui-button aui-button-ghost aui-button-icon"
              onClick={handleDownloadClick}
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

const ToolResultActionBar = ({ message }: ToolResultActionBarProps) => {
  // const { TimeAgo } = useTimeAgo()
  const dispatch = useAppDispatch()
  const { isSignedIn } = useAuthState()

  // Session post tools that have their own badge in SessionPostEmbed
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

  // Get completed tool calls with results that have creation IDs
  // Exclude session post tools and tools with child_session (they render their own badge)
  const completedToolCallsWithCreations =
    message.tool_calls?.filter(toolCall => {
      // Normalize tool name for comparison (trim whitespace and lowercase)
      const normalizedToolName = (toolCall.tool || '').trim().toLowerCase()
      const results = normalizeToolResults(toolCall.result)

      return (
        toolCall.status === 'completed' &&
        results.length > 0 &&
        results.some(
          (result: TaskV2Result) =>
            result &&
            Array.isArray(result?.output) &&
            result.output.some(
              (output: TasksV2ResultOutput) => output.creation,
            ),
        ) &&
        !SESSION_POST_TOOLS.includes(normalizedToolName) &&
        !toolCall.child_session
      )
    }) || []

  // Get all creation IDs from completed tool calls
  const creationIds = completedToolCallsWithCreations.flatMap(toolCall =>
    normalizeToolResults(toolCall.result).flatMap((result: TaskV2Result) =>
      Array.isArray(result?.output)
        ? result.output
            .filter((output: TasksV2ResultOutput) => output.creation)
            .map((output: TasksV2ResultOutput) =>
              typeof output.creation === 'string'
                ? output.creation
                : output.creation?._id,
            )
        : [],
    ),
  )

  const uniqueCreationIds = Array.from(
    new Set(creationIds.filter((id): id is string => Boolean(id))),
  )

  const handleAddToCollection = (creationId: string) => {
    dispatch(
      updateAddToCollectionModal({
        isOpen: true,
        creationIds: [creationId],
      }),
    )
  }

  return (
    <div className="aui-assistant-action-bar-root flex flex-wrap items-center gap-2 w-full z-10">
      {uniqueCreationIds[0] && (
        <ToolActionButton creationId={uniqueCreationIds[0]} />
      )}

      {uniqueCreationIds.length > 1 && (
        <div className="flex items-center gap-1">
          {uniqueCreationIds.slice(1).map((creationId, index) => (
            <button
              key={creationId}
              className="aui-button aui-button-ghost aui-button-icon"
              onClick={() => handleAddToCollection(creationId)}
              title={`Add creation ${index + 2} to collection`}
              disabled={!isSignedIn}
            >
              <BookmarkPlusIcon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2 max-w-full min-w-0 justify-end">
        {completedToolCallsWithCreations.map((toolCall, index) => (
          <ToolHoverMenu
            key={`${toolCall.id}-${index}`}
            toolName={toolCall.tool!}
            args={toolCall.args}
            result={toolCall.result}
          />
        ))}
        <LLMCallButton
          llmCallId={message.llm_call}
          observability={message.observability || null}
        />
        {/* <div
          className="text-xs bg-transparent"
          title={new Date(message.createdAt).toLocaleString()}
        >
          <TimeAgo date={new Date(message.createdAt)} />
        </div> */}
      </div>
    </div>
  )
}

export default ToolResultActionBar
