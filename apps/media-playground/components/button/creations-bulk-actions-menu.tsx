import DeleteBulkActionItem from '@/components/button/delete-bulk-action-item'
import PrivacyBulkActionItem from '@/components/button/privacy-bulk-action-item'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateAddToCollectionModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  BookmarkPlusIcon,
  EllipsisIcon,
  PictureInPicture2Icon,
  PictureInPictureIcon,
} from 'lucide-react'
import React from 'react'

interface CreationsBulkActionsMenuProps {
  creations: CreationV2[]
  queryKey: QueryKey
}

const CreationsBulkActionsMenu = ({
  creations,
  queryKey,
}: CreationsBulkActionsMenuProps) => {
  const dispatch = useAppDispatch()

  const handleAddToCollectionSelect = () => {
    dispatch(updateAddToCollectionModal({ isOpen: true, creationIds: creations.map(creation => creation._id) }))
  }

  if (!creations) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <EllipsisIcon className="group-hover:text-primary" />
            <span className="ml-2 hidden md:block">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <PrivacyBulkActionItem
              type="creation"
              items={creations}
              queryKey={queryKey}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleAddToCollectionSelect}
            className="cursor-pointer group"
          >
            <BookmarkPlusIcon className="mr-2 h-4 w-4" />
            <span>Add to Collection</span>
            <PictureInPicture2Icon className="group-hover:hidden h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
            <PictureInPictureIcon className="hidden group-hover:block h-4 w-4 ml-auto text-muted-foreground group-hover:text-popover-foreground" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DeleteBulkActionItem
              type="creation"
              items={creations}
              queryKey={queryKey}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default CreationsBulkActionsMenu
