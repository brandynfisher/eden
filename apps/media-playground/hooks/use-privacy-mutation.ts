import { fetcher } from '@/lib/fetcher'
import {
  isCreationData,
  isInfiniteData,
  isModelData,
  isTaskV2,
  isTasksV2ListResponse,
} from '@/lib/query/guards'
import { capitalize } from '@/lib/strings'
import {
  CreationV2,
  CreationsV2PatchResponse,
  FeedV2CursorResponse,
  ModelV2,
  ModelsV2PatchResponse,
  TasksV2ListResponse,
} from '@edenlabs/eden-sdk'
import {
  InfiniteData,
  QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'

// Define a union type for possible previousData types for the timeline
type PreviousTimelineData =
  | InfiniteData<TasksV2ListResponse | FeedV2CursorResponse>
  | undefined

// Define a union type for possible previousData types for the single item
// Simplified to only CreationV2 or ModelV2 for this hook's current usage context
type PreviousItemData = CreationV2 | ModelV2 | undefined

type MutationContext = {
  previousTimelineData: PreviousTimelineData
  previousItemData: PreviousItemData
}

type MutationOptions = {
  type: 'creation' | 'model' // Simplified type
  timelineQueryKey: QueryKey
  itemQueryKey: QueryKey
  onSuccessMessage?: string
}

export function usePrivacyMutation({
  type,
  timelineQueryKey,
  itemQueryKey,
  onSuccessMessage,
}: MutationOptions) {
  const queryClient = useQueryClient()

  return useMutation<
    ModelsV2PatchResponse | CreationsV2PatchResponse, // Simplified response types
    Error,
    { ids: string[]; public: boolean },
    MutationContext
  >({
    mutationFn: async ({ ids, public: isPublic }) => {
      // Endpoint logic remains the same as type is passed correctly
      const endpoint =
        ids.length === 1 ? `/api/${type}s/${ids[0]}` : `/api/${type}s/bulk`

      const response = await fetcher<
        ModelsV2PatchResponse | CreationsV2PatchResponse
      >(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          ids.length === 1
            ? { public: isPublic }
            : { [`${type}Ids`]: ids, public: isPublic },
        ),
      })

      if (!response) {
        throw new Error('Empty response from server')
      }

      return response
    },
    onMutate: async ({ ids, public: isPublic }): Promise<MutationContext> => {
      // Cancel queries for both keys
      await queryClient.cancelQueries({ queryKey: timelineQueryKey })
      await queryClient.cancelQueries({ queryKey: itemQueryKey })

      // Get previous data for both keys
      const previousTimelineData =
        queryClient.getQueryData<PreviousTimelineData>(timelineQueryKey)
      const previousItemData =
        queryClient.getQueryData<PreviousItemData>(itemQueryKey)

      // Optimistic update for Timeline Data (TaskV2 list)
      if (previousTimelineData && isInfiniteData(previousTimelineData)) {
        const newTimelineData = {
          ...previousTimelineData,
          pages: previousTimelineData.pages.map(page => {
            if (isTasksV2ListResponse(page)) {
              return {
                ...page,
                docs: page?.docs?.map(doc => {
                  if (!isTaskV2(doc)) return doc
                  return {
                    ...doc,
                    result: doc.result.map(result => {
                      result.output = result.output.map(output => {
                        if (
                          type === 'creation' &&
                          output.creation &&
                          ids.includes(output.creation._id)
                        ) {
                          return {
                            ...output,
                            creation: {
                              ...output.creation,
                              public: isPublic,
                            },
                          }
                        }
                        if (
                          type === 'model' &&
                          output.model &&
                          ids.includes(output.model._id)
                        ) {
                          return {
                            ...output,
                            model: {
                              ...output.model,
                              public: isPublic,
                            },
                          }
                        }
                        return output
                      })
                      return result
                    }),
                  }
                }),
              }
            }
            return page
          }),
        }
        queryClient.setQueryData(timelineQueryKey, newTimelineData)
      }

      // Optimistic update for Item Data (CreationV2 or ModelV2)
      if (previousItemData) {
        let newItemData: PreviousItemData = undefined
        if (
          type === 'creation' &&
          isCreationData(previousItemData) &&
          ids.includes(previousItemData._id)
        ) {
          newItemData = { ...previousItemData, public: isPublic }
        } else if (
          type === 'model' &&
          isModelData(previousItemData) &&
          ids.includes(previousItemData._id)
        ) {
          newItemData = { ...previousItemData, public: isPublic }
        }
        // Removed agent/collection checks

        if (newItemData) {
          queryClient.setQueryData(itemQueryKey, newItemData)
        }
      }

      // Return context for potential rollback
      return { previousTimelineData, previousItemData }
    },
    onError: (_err, _variables, context) => {
      // Rollback both optimistic updates on error
      if (context?.previousTimelineData) {
        queryClient.setQueryData(timelineQueryKey, context.previousTimelineData)
      }
      if (context?.previousItemData) {
        queryClient.setQueryData(itemQueryKey, context.previousItemData)
      }
      toast.error(`Failed to update ${type} privacy`, {
        description: 'Please try again.',
        dismissible: true,
        richColors: true,
      })
    },
    onSuccess: (
      _response: ModelsV2PatchResponse | CreationsV2PatchResponse,
      variables,
    ) => {
      const message = onSuccessMessage
        ? onSuccessMessage
        : `${capitalize(type)} updated`
      toast.success(message, {
        description: `Set to ${variables.public ? 'public' : 'private'}`,
        dismissible: true,
        richColors: true,
      })
    },
    onSettled: async () => {
      // Invalidate both queries for eventual consistency
      await queryClient.invalidateQueries({ queryKey: timelineQueryKey })
      await queryClient.invalidateQueries({ queryKey: itemQueryKey })
    },
  })
}
