import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useDelete } from '@/hooks/use-delete'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { Trash2Icon } from 'lucide-react'
import React from 'react'

type Props = {
  item: ModelV2 | CreationV2
  type: 'creation' | 'model'
  queryKey: QueryKey
}

const DeleteActionItem = ({ type, item, queryKey }: Props) => {
  const { handleDelete } = useDelete({ type, item, queryKey })

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
