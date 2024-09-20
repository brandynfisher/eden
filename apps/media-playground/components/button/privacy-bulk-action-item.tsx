import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useTogglePrivacyBulk } from '@/hooks/use-toggle-privacy-bulk'
import { CreationV2 } from '@edenlabs/eden-sdk'
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
        <span>
          Set <strong>Private</strong>
        </span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleSetPublic} className="cursor-pointer">
        <span>
          Set <strong>Public</strong>
        </span>
      </DropdownMenuItem>
    </>
  )
}

export default PrivacyBulkActionItem
