import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useTogglePrivacyBulk } from '@/hooks/use-toggle-privacy-bulk'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { LockIcon, LockOpenIcon } from 'lucide-react'
import React from 'react'

type Props = {
  items: CreationV2[]
  type: 'creation'
  onUpdate?: (items: CreationV2[]) => void
}

const PrivacyBulkActionItem = ({ type, items, onUpdate }: Props) => {
  const { handleSetPrivate, handleSetPublic } = useTogglePrivacyBulk({
    type,
    items,
    onUpdate,
  })

  return (
    <>
      <DropdownMenuItem onClick={handleSetPrivate} className="cursor-pointer">
        <LockIcon className="mr-2 h-4 w-4" />
        <span>
          Set <strong>Private</strong>
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleSetPublic} className="cursor-pointer">
        <LockOpenIcon className="mr-2 h-4 w-4" />
        <span>
          Set <strong>Public</strong>
        </span>
      </DropdownMenuItem>
    </>
  )
}

export default PrivacyBulkActionItem
