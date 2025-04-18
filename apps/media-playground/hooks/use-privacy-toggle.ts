import { usePrivacyMutation } from '@/hooks/use-privacy-mutation'
import { capitalize } from '@/lib/strings'
// Removed Agent, CollectionV2 as they are unused in this simplified hook
import {
  /* Agent, CollectionV2, */
  CreationV2,
  ModelV2,
} from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'

type TogglePrivacyProps = {
  type: 'creation' | 'model' // Simplified
  item: ModelV2 | CreationV2
  timelineQueryKey: QueryKey
  itemQueryKey: QueryKey
}

export function usePrivacyToggle({
  type,
  item,
  timelineQueryKey,
  itemQueryKey,
}: TogglePrivacyProps) {
  const mutation = usePrivacyMutation({
    type,
    timelineQueryKey,
    itemQueryKey,
    onSuccessMessage: `${capitalize(type)} updated`,
  })

  const handleToggle = () => {
    // Ensure we don't stack mutations if already pending
    if (!mutation.isPending) {
      mutation.mutate({ ids: [item._id], public: !item.public })
    }
  }

  return {
    handleToggle,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
