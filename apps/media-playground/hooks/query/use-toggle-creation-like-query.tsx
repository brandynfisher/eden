import { CreationV2 } from '@edenlabs/eden-sdk'
import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export const useToggleCreationLikeQuery = ({
  isLiked,
  queryKey,
}: {
  isLiked: boolean
  queryKey: QueryKey
}) => {
  const queryClient = useQueryClient()

  const initialLikeCount =
    queryClient.getQueryData<{
      creation: CreationV2
    }>(queryKey)?.creation?.likeCount || 0

  const { mutateAsync: toggleLike, isPending } = useMutation({
    mutationFn: async (creationId: string) => {
      if (isLiked) {
        await axios.delete(`/api/creations/${creationId}/likes`)
      } else {
        await axios.post(`/api/creations/${creationId}/likes`)
      }
    },
    onMutate: () => {
      queryClient.setQueryData(
        queryKey,
        (oldData: { creation: CreationV2 }) => {
          return {
            creation: {
              ...oldData.creation,
              isLiked: !isLiked,
              likeCount: !isLiked
                ? (oldData.creation.likeCount || 0) + 1
                : (oldData.creation.likeCount || 0) - 1,
            },
          }
        },
      )
    },
    onError: () => {
      queryClient.setQueryData(
        queryKey,
        (oldData: { creation: CreationV2 }) => {
          return {
            creation: {
              ...oldData.creation,
              isLiked: isLiked,
              likeCount: initialLikeCount,
            },
          }
        },
      )
      toast.error(`Could not ${isLiked ? 'unlike' : 'like'} creation`, {
        description: 'Please try again later',
        dismissible: true,
        richColors: true,
      })
    },
  })

  return { toggleLike, isPending }
}
