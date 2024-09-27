import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteBulkActionItem from '@/components/button/delete-bulk-action-item'
import PrivacyBulkActionItem from '@/components/button/privacy-bulk-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import { CreationV2 } from '@edenlabs/eden-sdk'
import React, { ReactNode, useState } from 'react'

type Props = {
  label?: ReactNode
  creations: CreationV2[]
  onUpdate?: (items: CreationV2[]) => void
  className?: string
}

const CreationsBulkActionsMenu = ({
  creations,
  label,
  onUpdate,
  className,
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
          onUpdate={onUpdate}
          userId={user?._id}
        />
      )}
    </ActionsDropdown>
  )
}

type ContentProps = {
  creations: CreationV2[]
  onUpdate?: (item: CreationV2[]) => void
  userId?: string
}

const CreationsBulkActionsContent = ({ creations, onUpdate }: ContentProps) => {
  return (
    <>
      <DropdownMenuGroup>
        <PrivacyBulkActionItem
          type="creation"
          items={creations}
          onUpdate={onUpdate}
        />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DeleteBulkActionItem
          type="creation"
          items={creations}
          onUpdate={onUpdate}
        />
      </DropdownMenuGroup>
    </>
  )
}

export default CreationsBulkActionsMenu
