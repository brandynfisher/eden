import { fetcher } from '@/lib/fetcher'
import { CreationV2, CreationsV2PatchResponse } from '@edenlabs/eden-sdk'
import { toast } from 'sonner'

type Props = {
  type: 'creation' | 'model'
  items: CreationV2[]
  onUpdate?: (items: CreationV2[]) => void
}
export function useDeleteBulk({ type, items, onUpdate }: Props) {
  const handleDelete = async () => {
    console.log({ onUpdate })
    try {
      const response: CreationsV2PatchResponse = await fetcher(
        `/api/${type}s/bulk`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            creationIds: items.map(item => item._id),
            deleted: true,
          }),
        },
      )

      if (!response) {
        console.error('response empty')
        return
      }

      toast.success(`${type} deleted`, {
        description: `${items.length} items`,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Delete Error`, {
        description: `Failed to delete ${type}s`,
        dismissible: true,
        richColors: true,
      })
    }
  }

  return {
    handleDelete,
  }
}
