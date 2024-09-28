import { usePrivacyToggleMutation } from '@/hooks/use-privacy-toggle-mutation'
import { capitalize } from '@/lib/strings'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'

type TogglePrivacyProps = {
  type: 'creation' | 'model'
  item: ModelV2 | CreationV2
  queryKey: QueryKey
}

export function usePrivacyToggle({ type, item, queryKey }: TogglePrivacyProps) {
  const mutation = usePrivacyToggleMutation({
    type,
    queryKey,
    onSuccessMessage: `${capitalize(type)} updated`,
  })

  const handleToggle = () => {
    mutation.mutate({ ids: [item._id], public: !item.public })
  }

  return {
    handleToggle,
    isPending: mutation.isPending,
  }
}
