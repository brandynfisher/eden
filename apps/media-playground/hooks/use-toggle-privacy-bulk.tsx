import { fetcher } from '@/lib/fetcher'
import { CreationV2, CreationsV2PatchResponse } from '@edenlabs/eden-sdk'
import { toast } from 'sonner'

type Props = {
  type: 'creation' | 'model'
  items: CreationV2[]
  onUpdate?: (items: CreationV2[]) => void
}
export function useTogglePrivacyBulk({ type, items, onUpdate }: Props) {
  const handleSetPrivate = async () => {
    console.log({ onUpdate })
    try {
      const response: CreationsV2PatchResponse = await fetcher(
        `/api/${type}s/bulk`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            creationIds: items.map(item => item._id),
            public: false,
          }),
        },
      )

      if (!response) {
        console.error('response empty')
        return
      }

      toast.success(`${type}s updated`, {
        description: `Set to 'private'`,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Update Error`, {
        description: 'Failed to update privacy setting',
        dismissible: true,
        richColors: true,
      })
    }
  }

  const handleSetPublic = async () => {
    try {
      const response: CreationsV2PatchResponse = await fetcher(
        `/api/${type}s/bulk`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            creationIds: items.map(item => item._id),
            public: true,
          }),
        },
      )

      if (!response) {
        console.error('response empty')
        return
      }

      toast.success(`${type} updated`, {
        description: `Set to 'public'`,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Update Error`, {
        description: 'Failed to update privacy setting',
        dismissible: true,
        richColors: true,
      })
    }
  }

  return {
    handleSetPrivate,
    handleSetPublic,
  }
}
