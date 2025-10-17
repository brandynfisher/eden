import { SubscriptionCrownBadge } from '@/components/badge/subscription-crown-badge'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { usePrivacyToggle } from '@/hooks/use-privacy-toggle'
import {
  GatedActions,
  useSubscriptionGate,
} from '@/hooks/use-subscription-gate'
import { Agent, CollectionV2, CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { Loader2Icon, LockIcon, LockOpenIcon } from 'lucide-react'
import React, { useMemo } from 'react'

type Props = {
  item: ModelV2 | CreationV2 | CollectionV2 | Agent // Updated type to match usePrivacyToggle
  type: 'creation' | 'model' | 'collection' | 'agent' // Updated type to match usePrivacyToggle
  queryKey: QueryKey // This is the timeline query key
}

const PrivacyActionItem = ({ type, item, queryKey }: Props) => {
  const { isAllowed: isAllowedPrivacy } = useSubscriptionGate(
    GatedActions.MakePrivate,
  )

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

  const onChangePrivacy = () => {
    if (isAllowedPrivacy || !item.public) {
      handleToggle()
    }
  }

  return (
    <>
      <DropdownMenuItem
        onClick={onChangePrivacy}
        className="cursor-pointer relative"
        disabled={isPending} // Disable button while pending
      >
        {isPending ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : displayPublic ? (
          <LockOpenIcon className="mr-2 h-4 w-4" /> // Icon for Public state
        ) : (
          <LockIcon className="mr-2 h-4 w-4" />
        )}
        <span>
          Set <strong>{displayPublic ? 'Private' : 'Public'}</strong>
        </span>

        <SubscriptionCrownBadge
          isPublic={item.public}
          type={type}
          className="ml-auto"
        />
        {/*<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>*/}
      </DropdownMenuItem>
    </>
  )
}

export default PrivacyActionItem
