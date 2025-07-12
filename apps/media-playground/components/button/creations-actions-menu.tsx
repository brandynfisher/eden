import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import DownloadActionItem from '@/components/button/download-action-item'
import LikeButton from '@/components/button/like-button'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  updateAddToCollectionModal,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { generateFilename } from '@/utils/slug.util'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  BookmarkPlusIcon,
  ExternalLinkIcon,
  PictureInPicture2Icon,
  PictureInPictureIcon,
  Share2Icon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  creation: CreationV2
  queryKey: QueryKey
  className?: string
}

const CreationActionsMenu = ({ creation, queryKey, className }: Props) => {
  const { user, isSignedIn } = useAuthState()
  const dispatch = useAppDispatch()

  const creationData = creation

  if (!creationData) {
    return null
  }

  const handleAddToCollectionClick = () => {
    dispatch(
      updateAddToCollectionModal({
        isOpen: true,
        creationIds: [creationData._id],
      }),
    )
  }

  const handleShareClick = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/creations/${creationData._id}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl: shareUrl,
      }),
    )
  }

  return (
    <>
      <ActionsDropdown className={className}>
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                className="cursor-pointer"
                href={`/creations/${creationData._id}`}
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Details
                {/*<DropdownMenuShortcut>⇧⌘O</DropdownMenuShortcut>*/}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <button
                type="button"
                className="w-full"
                onClick={handleShareClick}
              >
                <Share2Icon className="mr-2 h-4 w-4" />
                Share
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <LikeButton
                type="creation"
                id={creationData._id}
                isLiked={creationData.isLiked || false}
                likeCount={creationData.likeCount || 0}
                isDropdownItem={true}
                disabled={!isSignedIn}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer w-full group"
              onClick={handleAddToCollectionClick}
              disabled={!isSignedIn}
            >
              <BookmarkPlusIcon className="mr-2 h-4 w-4" />
              Add to collection
              <PictureInPicture2Icon className="group-hover:hidden h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
              <PictureInPictureIcon className="hidden group-hover:block h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {creationData && creationData.user?._id === user?._id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <PrivacyActionItem
                  type="creation"
                  item={creationData}
                  queryKey={queryKey}
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DeleteActionItem
                  type="creation"
                  item={creationData}
                  queryKey={queryKey}
                />
              </DropdownMenuGroup>
            </>
          )}
          {isSignedIn && creationData ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DownloadActionItem
                  type="creation"
                  originalFileUrl={creationData.filename || ''}
                  saveAsFileName={generateFilename(
                    creationData.user?.username || '',
                    creationData.task?.args?.prompt?.substring(0, 64).trim() ||
                      '',
                    creationData._id || '',
                  )}
                />
              </DropdownMenuGroup>
            </>
          ) : null}
        </>
      </ActionsDropdown>
    </>
  )
}

export default CreationActionsMenu
