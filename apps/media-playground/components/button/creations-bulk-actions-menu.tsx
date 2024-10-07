import ActionsDropdown from '@/components/button/actions-dropdown'
import AddToCollectionActionItem from '@/components/button/add-to-collection-action-item'
import DeleteBulkActionItem from '@/components/button/delete-bulk-action-item'
import PrivacyBulkActionItem from '@/components/button/privacy-bulk-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import React, { ReactNode, useState } from 'react'

type Props = {
  label?: ReactNode
  creations: CreationV2[]
  queryKey: QueryKey
  className?: string
  onAddToCollection: () => void
}

const CreationsBulkActionsMenu = ({
  creations,
  label,
  queryKey,
  className,
  onAddToCollection,
}: Props) => {
  const { user } = useAuthState()
  const [isOpen, setIsOpen] = useState(false)

  if (!creations) {
    return null
  }

  return (
    <ActionsDropdown
      size={'sm'}
      className={className}
      onOpenChange={setIsOpen}
      label={label}
    >
      {isOpen && (
        <CreationsBulkActionsContent
          creations={creations}
          queryKey={queryKey}
          userId={user?._id}
          onAddToCollection={onAddToCollection}
        />
      )}
    </ActionsDropdown>
  )
}

type ContentProps = {
  creations: CreationV2[]
  queryKey: QueryKey
  userId?: string
  onAddToCollection: () => void
}

const CreationsBulkActionsContent = ({
  creations,
  queryKey,
  onAddToCollection,
}: ContentProps) => {
  return (
    <>
      <DropdownMenuGroup>
        <PrivacyBulkActionItem
          type="creation"
          items={creations}
          queryKey={queryKey}
        />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <AddToCollectionActionItem onClick={onAddToCollection} />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DeleteBulkActionItem
          type="creation"
          items={creations}
          queryKey={queryKey}
        />
      </DropdownMenuGroup>
    </>
  )
}

export default CreationsBulkActionsMenu
