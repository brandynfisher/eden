// hooks/useTogglePrivacyBulk.ts
import { usePrivacyToggleMutation } from '@/hooks/use-privacy-toggle-mutation'
import { capitalize } from '@/lib/strings'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'

// Props for the bulk toggle hook
type TogglePrivacyBulkProps = {
  type: 'creation' | 'model'
  items: (ModelV2 | CreationV2)[]
  queryKey: QueryKey
}

export function usePrivacyToggleBulk({
  type,
  items,
  queryKey,
}: TogglePrivacyBulkProps) {
  const mutation = usePrivacyToggleMutation({
    type,
    queryKey,
    onSuccessMessage: `${capitalize(type)}s updated`,
  })

  const handleSetPrivate = () => {
    const ids = items.map(item => item._id)
    mutation.mutate({ ids, public: false })
  }

  const handleSetPublic = () => {
    const ids = items.map(item => item._id)
    mutation.mutate({ ids, public: true })
  }

  return {
    handleSetPrivate,
    handleSetPublic,
    isPending: mutation.isPending,
  }
}
