import DeleteBulkActionItem from '@/components/button/delete-bulk-action-item'
import PrivacyBulkActionItem from '@/components/button/privacy-bulk-action-item'
import CollectionSelectionDialog from '@/components/dialog/collection-selection-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleAddToCollectionModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { BookmarkPlusIcon, EllipsisIcon } from 'lucide-react'

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
    dispatch(toggleAddToCollectionModal())
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
          <DropdownMenuItem onClick={handleAddToCollectionSelect}>
            <BookmarkPlusIcon className="mr-2 h-4 w-4" />
            <span>Add to Collection</span>
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
      <CollectionSelectionDialog creations={creations} />
    </>
  )
}

export default CreationsBulkActionsMenu
