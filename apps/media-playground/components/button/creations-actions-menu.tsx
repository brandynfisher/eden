import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import DownloadActionItem from '@/components/button/download-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  updateAddToCollectionModal,
  toggleQuickAnimateModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  BookmarkPlusIcon,
  ExternalLinkIcon,
  FileSlidersIcon,
  FilmIcon,
  PictureInPicture2Icon,
  PictureInPictureIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  creation: CreationV2
  queryKey: QueryKey
  className?: string
}

const CreationActionsMenu = ({ creation, queryKey, className }: Props) => {
  const { user } = useAuthState()
  const [isOpen, setIsOpen] = useState(false)

  if (!creation) {
    return null
  }

  return (
    <>
      <ActionsDropdown className={className} onOpenChange={setIsOpen}>
        {isOpen && (
          <CreationActionsContent
            creation={creation}
            queryKey={queryKey}
            userId={user?._id}
            isOpen={isOpen}
          />
        )}
      </ActionsDropdown>
    </>
  )
}

type ContentProps = {
  creation: CreationV2
  queryKey: QueryKey
  userId?: string
  isOpen?: boolean
}

const CreationActionsContent = ({
  creation,
  queryKey,
  userId,
  isOpen,
}: ContentProps) => {
  const dispatch = useAppDispatch()

  const { isSignedIn } = useAuthState()
  const { creation: creationResponse } = useCreationQuery({
    key: creation._id,
    initialData: {
      creation,
    },
    enabled: isOpen,
  })

  const creationData = creationResponse || creation

  const handleAddToCollectionClick = () => {
    dispatch(updateAddToCollectionModal({ isOpen: true, creationIds: [creationData._id] }))
  }

  const handleQuickAnimateClick = () => {
    dispatch(toggleQuickAnimateModal())
  }

  return (
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
        <DropdownMenuSeparator />
        {creationData.mediaAttributes?.type === 'image' ? (
          <DropdownMenuItem
            disabled={!isSignedIn}
            className="cursor-pointer group"
            onClick={handleQuickAnimateClick}
          >
            <FilmIcon className="mr-2 h-4 w-4" />
            Animate
            <PictureInPicture2Icon className="group-hover:hidden h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
            <PictureInPictureIcon className="hidden group-hover:block h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link
            className="cursor-pointer"
            href={`/create/${creationData.mediaAttributes?.type}/${creationData.workflow}?creation=${creationData._id}`}
            scroll={false}
            shallow={true}
          >
            <FileSlidersIcon className="mr-2 h-4 w-4" />
            Use as Preset
            {/*<DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer w-full group"
          onClick={handleAddToCollectionClick}
        >
          <BookmarkPlusIcon className="mr-2 h-4 w-4" />
          Add to collection
          <PictureInPicture2Icon className="group-hover:hidden h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
          <PictureInPictureIcon className="hidden group-hover:block h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
        </DropdownMenuItem>
      </DropdownMenuGroup>
      {creationData.user._id === userId && (
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
      {isSignedIn ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DownloadActionItem
              type="creation"
              originalFileUrl={creationData.url || ''}
              saveAsFileName={`${creationData.user.username}${
                creationData.args.prompt
                  ? `_${creationData.args.prompt
                      .substring(0, 64)
                      .trim()
                      .replace(/\s+/g, '-')}`
                  : ``
              }_${creationData._id}`}
            />
          </DropdownMenuGroup>
        </>
      ) : null}
    </>
  )
}

export default CreationActionsMenu
