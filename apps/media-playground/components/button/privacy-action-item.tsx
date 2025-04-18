import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { usePrivacyToggle } from '@/hooks/use-privacy-toggle'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { Loader2Icon, LockIcon, LockOpenIcon } from 'lucide-react'
import React, { useMemo } from 'react'

type Props = {
  item: ModelV2 | CreationV2 // Updated type to match usePrivacyToggle
  type: 'creation' | 'model' // Updated type to match usePrivacyToggle
  queryKey: QueryKey // This is the timeline query key
}

const PrivacyActionItem = ({ type, item, queryKey }: Props) => {
  // console.log('[PrivacyActionItem] Rendering/Re-rendering...',
  //   { type, itemId: item._id, itemPublic: item.public, queryKey },
  // )

  // Construct the item-specific query key
  const itemQueryKey: QueryKey = useMemo(
    () => [type, item._id],
    [type, item._id],
  )

  const { handleToggle, isPending } = usePrivacyToggle({
    type,
    item,
    timelineQueryKey: queryKey,
    itemQueryKey,
  })

  // Determine the effective public status for UI display
  // While pending, show the opposite of the current state
  const displayPublic = isPending ? !item.public : item.public

  // console.log('[PrivacyActionItem] State values:',
  //   { isPending, itemPublic: item.public, displayPublic },
  // )

  return (
    <DropdownMenuItem
      onClick={handleToggle}
      className="cursor-pointer"
      disabled={isPending} // Disable button while pending
    >
      {isPending ? (
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
      ) : displayPublic ? (
        <LockOpenIcon className="mr-2 h-4 w-4" /> // Icon for Public state
      ) : (
        <LockIcon className="mr-2 h-4 w-4" /> // Icon for Private state
      )}
      <span>
        Set <strong>{displayPublic ? 'Private' : 'Public'}</strong>
      </span>
      {/*<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>*/}
    </DropdownMenuItem>
  )
}

export default PrivacyActionItem
