import {
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { fetcher } from '@/lib/fetcher'
import { ModelV2, ModelsV2PatchResponse } from '@edenlabs/eden-sdk'
import { LockIcon, LockOpenIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

type Props = {
  item: ModelV2
  type: 'creation' | 'model'
  onUpdate?: (item: ModelV2) => void
}

const PrivacyActionItem = ({ type, item, onUpdate }: Props) => {
  const onTogglePublic = async () => {
    try {
      const response: ModelsV2PatchResponse = await fetcher(
        `/api/${type}s/${item._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            public: !item.public,
          }),
        },
      )

      if (!response) {
        console.error('response empty')
        return
      }

      if (!response.model) {
        console.error('response empty')
        return
      }

      onUpdate && onUpdate(response.model)

      toast.success(`${type} updated`, {
        description: `set to ${item.public ? 'private' : 'public'}`,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Update Error`, {
        description: 'Failed to toggle privacy setting',
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <DropdownMenuItem onClick={onTogglePublic} className="cursor-pointer">
      {item.public ? (
        <LockIcon className="mr-2 h-4 w-4" />
      ) : (
        <LockOpenIcon className="mr-2 h-4 w-4" />
      )}
      <span>
        Set <strong>{item.public ? 'Private' : 'Public'}</strong>
      </span>
      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
  )
}

export default PrivacyActionItem
