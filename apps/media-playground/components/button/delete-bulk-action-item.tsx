import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useDeleteBulk } from '@/hooks/use-delete-bulk'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { Trash2Icon } from 'lucide-react'
import React from 'react'

type Props = {
  items: CreationV2[]
  type: 'creation'
  onUpdate?: (items: CreationV2[]) => void
}

const PrivacyBulkActionItem = ({ type, items, onUpdate }: Props) => {
  const { handleDelete } = useDeleteBulk({
    type,
    items,
    onUpdate,
  })

  return (
    <>
      <DropdownMenuItem
        onClick={handleDelete}
        className="cursor-pointer text-destructive"
      >
        <Trash2Icon className="mr-2 h-4 w-4" />
        <span>Delete</span>
      </DropdownMenuItem>
    </>
  )
}

export default PrivacyBulkActionItem
