import LikeButton from '@/components/button/like-button'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import PrivacyToggle from '@/features/detail/privacy-toggle'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useDeleteMutation } from '@/hooks/use-delete-mutation'
import { getFileTypeByMimeType } from '@/lib/files'
import { downloadFile } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  updateAddToCollectionModal,
  updateDeleteDialog,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { generateFilename } from '@/utils/slug.util'
import { TaskV2, TaskV2Result, TasksV2ResultOutput } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  BookmarkPlusIcon,
  DownloadIcon,
  FileSlidersIcon,
  TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { toast } from 'sonner'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  output: TasksV2ResultOutput
  queryKey: QueryKey
  className?: string
}

const TimelineItemResultTools = ({ output, queryKey, className }: Props) => {
  const { user, isSignedIn } = useAuthState()
  const dispatch = useAppDispatch()

  const creation = output.creation
  const model = output.model
  const item = creation || model
  const itemType = creation ? 'creation' : 'model'

  // Fetch fresh creation data to ensure isLiked is accurate
  const { creation: creationData } = useCreationQuery({
    key: creation?._id || '',
    enabled: !!creation?._id,
    staleTime: 0, // Always fetch fresh data
  })

  // Use the fresh creation data if available, otherwise fall back to the creation from output
  const creationWithLikeStatus = creationData || creation

  const { mutate: deleteMutation } = useDeleteMutation({
    type: itemType as 'creation' | 'model',
    queryKey: queryKey,
  })

  if (!item) return null

  const isOwner = item.user?._id === user?._id

  const handleAddToCollectionClick = () => {
    if (!creation) return
    dispatch(
      updateAddToCollectionModal({
        isOpen: true,
        creationIds: [creation._id],
      }),
    )
  }

  const handleDownloadClick = async () => {
    if (!creation?.filename) return

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

  const handleUseAsPreset = () => {
    if (!creation) return '#'
    const fileType =
      getFileTypeByMimeType(creation.mediaAttributes?.mimeType) || 'image'
    return `/studio/${fileType}/${creation.tool}?creation=${creation._id}`
  }

  const handleDelete = () => {
    if (!isOwner || !item) return

    dispatch(
      updateDeleteDialog({
        isOpen: true,
        title: `Delete ${itemType}`,
        description: `Are you sure you want to delete this ${itemType}?`,
        onDelete: () => {
          deleteMutation({ ids: [item._id], deleted: true })
        },
      }),
    )
  }

  return (
    <div
      data-test-id="timeline-item-result-tools"
      className={cn([`relative text-sm mt-2`, className])}
    >
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {creationWithLikeStatus && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="[&>button]:h-8 [&>button]:w-8 [&>button]:p-0.5 [&>button>svg]:mr-0 [&>button]:text-[0px] [&>button]:bg-black/40 [&>button]:hover:bg-black/60 [&>button]:border-0">
                      <LikeButton
                        type="creation"
                        id={creationWithLikeStatus._id}
                        isLiked={creationWithLikeStatus.isLiked || false}
                        likeCount={creationWithLikeStatus.likeCount || 0}
                        disabled={!isSignedIn}
                        docQueryKeyId={creationWithLikeStatus._id}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Like</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0.5 bg-black/40 hover:bg-black/60 text-white border-0"
                      onClick={handleAddToCollectionClick}
                      disabled={!isSignedIn}
                    >
                      <BookmarkPlusIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Add to Collection</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0.5 bg-black/40 hover:bg-black/60 text-white border-0"
                      onClick={handleDownloadClick}
                      disabled={!isSignedIn}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0.5 bg-black/40 hover:bg-black/60 text-white border-0"
                      asChild
                      disabled={!isSignedIn}
                    >
                      <Link href={handleUseAsPreset()}>
                        <FileSlidersIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Use as Preset</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Suspense>
              <div className="[&_button]:h-8 [&_button]:bg-black/40 [&_button]:hover:bg-black/60 [&_button]:text-white [&_button]:border-0 [&_button]:p-0.5">
                <PrivacyToggle
                  queryKey={queryKey}
                  type={itemType as 'creation' | 'model'}
                  item={item}
                />
              </div>
            </Suspense>

            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0.5 bg-black/40 hover:bg-black/60 text-white border-0 hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}

export default TimelineItemResultTools
