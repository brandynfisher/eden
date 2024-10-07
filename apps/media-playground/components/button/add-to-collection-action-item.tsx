import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { BookmarkPlusIcon } from 'lucide-react'
import React, { useState } from 'react'

type Props = {
  onClick: () => void
}

const AddToCollectionActionItem = ({ onClick }: Props) => {
  return (
    <DropdownMenuItem className="cursor-pointer" onClick={onClick}>
      <BookmarkPlusIcon className="mr-2 h-4 w-4" />
      <span>Add to collection</span>
    </DropdownMenuItem>
  )
}

export default AddToCollectionActionItem
