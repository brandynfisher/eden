import { useDeleteMutation } from '@/hooks/use-delete-mutation'
import { capitalize } from '@/lib/strings'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'

type DeleteProps = {
  type: 'creation' | 'model'
  item: ModelV2 | CreationV2
  queryKey: QueryKey
}

export function useDelete({ type, item, queryKey }: DeleteProps) {
  const mutation = useDeleteMutation({
    type,
    queryKey,
    onSuccessMessage: `${capitalize(type)} deleted`,
  })

  const handleDelete = () => {
    mutation.mutate({ ids: [item._id], deleted: true })
  }

  return {
    handleDelete,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
