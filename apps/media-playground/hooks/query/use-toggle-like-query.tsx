import { Agent, CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export const useToggleLikeQuery = ({
  isLiked,
  queryKey,
  entityType,
}: {
  isLiked: boolean
  queryKey: QueryKey
  entityType: 'creation' | 'model' | 'agent'
}) => {
  const queryClient = useQueryClient()

  const initialLikeCount =
    queryClient.getQueryData<{
      creation?: CreationV2
      model?: ModelV2
      agent?: Agent
    }>(queryKey)?.[entityType]?.likeCount || 0

  const initialIsLiked =
    queryClient.getQueryData<{
      creation?: CreationV2
      model?: ModelV2
      agent?: Agent
    }>(queryKey)?.[entityType]?.isLiked || false

  let apiPath = ''
  if (entityType === 'creation') {
    apiPath = 'creations'
  } else if (entityType === 'model') {
    apiPath = 'models'
  } else if (entityType === 'agent') {
    apiPath = 'agents'
  }

  const { mutateAsync: toggleLike, isPending } = useMutation({
    mutationFn: async (entityId: string) => {
      if (isLiked) {
        await axios.delete(`/api/${apiPath}/${entityId}/likes`)
      } else {
        await axios.post(`/api/${apiPath}/${entityId}/likes`)
      }
    },
    onMutate: () => {
      queryClient.setQueryData(
        queryKey,
        (oldData: {
          creation?: CreationV2
          model?: ModelV2
          agent?: Agent
        }) => {
          return {
            [entityType]: {
              ...oldData[entityType],
              isLiked: !isLiked,
              likeCount: !isLiked
                ? (oldData[entityType]?.likeCount || 0) + 1
                : (oldData[entityType]?.likeCount || 0) - 1,
            },
          }
        },
      )
    },
    onError: () => {
      queryClient.setQueryData(
        queryKey,
        (oldData: {
          creation?: CreationV2
          model?: ModelV2
          agent?: Agent
        }) => {
          return {
            [entityType]: {
              ...oldData[entityType],
              isLiked: initialIsLiked,
              likeCount: initialLikeCount,
            },
          }
        },
      )
      toast.error(
        `Could not ${initialIsLiked ? 'unlike' : 'like'} ${entityType}`,
        {
          description: 'Please try again later',
          dismissible: true,
          richColors: true,
        },
      )
    },
  })

  return { toggleLike, isPending }
}
