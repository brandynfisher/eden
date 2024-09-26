import { fetcher } from '@/lib/fetcher'
import {
  CreationV2,
  CreationsV2PatchResponse,
  ModelV2,
  ModelsV2PatchResponse,
} from '@edenlabs/eden-sdk'
import { toast } from 'sonner'

function isModelsV2PatchResponse(
  response: ModelsV2PatchResponse | CreationsV2PatchResponse,
): response is ModelsV2PatchResponse {
  return (response as ModelsV2PatchResponse).model !== undefined
}

type Props = {
  type: 'creation' | 'model'
  item: ModelV2 | CreationV2
  onUpdate?: (item: ModelV2 | CreationV2) => void
}
export function useDelete({ type, item, onUpdate }: Props) {
  const handleDelete = async () => {
    try {
      const response: ModelsV2PatchResponse | CreationsV2PatchResponse =
        await fetcher(`/api/${type}s/${item._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            deleted: true,
          }),
        })

      if (!response) {
        console.error('response empty')
        return
      }

      if (isModelsV2PatchResponse(response)) {
        if (response.model) {
          onUpdate && onUpdate(response.model)
        }
      } else {
        if (response.creation) {
          onUpdate && onUpdate(response.creation)
        }
      }

      toast.success(`${type} deleted`, {
        description: ``,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Delete Error`, {
        description: `Failed to delete ${type}`,
        dismissible: true,
        richColors: true,
      })
    }
  }

  return { handleDelete }
}
