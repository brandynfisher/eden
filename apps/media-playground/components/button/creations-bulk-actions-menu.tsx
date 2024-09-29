import ActionsDropdown from '@/components/button/actions-dropdown'
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
}

const CreationsBulkActionsMenu = ({
  creations,
  label,
  queryKey,
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
          queryKey={queryKey}
          userId={user?._id}
        />
      )}
    </ActionsDropdown>
  )
}

type ContentProps = {
  creations: CreationV2[]
  queryKey: QueryKey
  userId?: string
}

const CreationsBulkActionsContent = ({ creations, queryKey }: ContentProps) => {
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
