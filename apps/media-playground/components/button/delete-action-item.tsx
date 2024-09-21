import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useDelete } from '@/hooks/use-delete'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { Trash2Icon } from 'lucide-react'
import React from 'react'

type Props = {
  item: ModelV2 | CreationV2
  type: 'creation' | 'model'
  onUpdate?: (item: ModelV2 | CreationV2) => void
}

const DeleteActionItem = ({ type, item, onUpdate }: Props) => {
  const { handleDelete } = useDelete({ type, item, onUpdate })

  return (
    <DropdownMenuItem
      onClick={handleDelete}
      className="cursor-pointer text-destructive"
    >
      <Trash2Icon className="mr-2 h-4 w-4" />
      <span>Delete</span>
    </DropdownMenuItem>
  )
}

export default DeleteActionItem
