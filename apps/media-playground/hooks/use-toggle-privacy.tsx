// hooks/useTogglePrivacy.ts
import { fetcher } from '@/lib/fetcher'
import {
  CreationV2,
  CreationsV2PatchResponse,
  FeedV2CursorResponse,
  ModelV2,
  ModelsV2PatchResponse,
  TaskV2,
  TasksV2ListResponse,
} from '@edenlabs/eden-sdk'
import {
  InfiniteData,
  QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'

// Type Guard to differentiate between Model and Creation patch responses
function isModelsV2PatchResponse(
  response: ModelsV2PatchResponse | CreationsV2PatchResponse,
): response is ModelsV2PatchResponse {
  return 'model' in response
}

// Type Guard to check if data is InfiniteData
function isInfiniteData(
  data: unknown,
): data is InfiniteData<TasksV2ListResponse | FeedV2CursorResponse> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'pages' in data &&
    Array.isArray(
      (data as InfiniteData<TasksV2ListResponse | FeedV2CursorResponse>).pages,
    )
  )
}

// Type Guard to check if data is CreationV2
function isCreationData(data: unknown): data is CreationV2 {
  return (
    typeof data === 'object' &&
    data !== null &&
    '_id' in data &&
    'public' in data
  )
}

// Type Guard to check if data is ModelV2
function isModelData(data: unknown): data is ModelV2 {
  return (
    typeof data === 'object' &&
    data !== null &&
    '_id' in data &&
    'public' in data
  )
}

// Type Guard to check if data is TaskV2
function isTaskV2(data: unknown): data is TaskV2 {
  return (
    typeof data === 'object' &&
    data !== null &&
    '_id' in data &&
    'result' in data &&
    Array.isArray((data as TaskV2).result)
  )
}

// Type Guard to check if data is TasksV2ListResponse
function isTasksV2ListResponse(data: unknown): data is TasksV2ListResponse {
  return (
    (typeof data === 'object' &&
      data !== null &&
      'docs' in data &&
      Array.isArray((data as TasksV2ListResponse).docs) &&
      (data as TasksV2ListResponse)?.docs?.every(doc => isTaskV2(doc))) ||
    false
  )
}

// Define a union type for possible previousData types
type PreviousData =
  | InfiniteData<TasksV2ListResponse | FeedV2CursorResponse>
  | CreationV2
  | ModelV2
  | undefined

// Props for the hook, including the queryKey for cache updates
type TogglePrivacyProps = {
  type: 'creation' | 'model'
  item: ModelV2 | CreationV2
  queryKey: QueryKey // Ensures type safety for the query key
}

export function useTogglePrivacy({ type, item, queryKey }: TogglePrivacyProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation<
    ModelsV2PatchResponse | CreationsV2PatchResponse,
    Error,
    void,
    { previousData: PreviousData }
  >({
    mutationFn: async (): Promise<
      ModelsV2PatchResponse | CreationsV2PatchResponse
    > => {
      const response = await fetcher<
        ModelsV2PatchResponse | CreationsV2PatchResponse
      >(`/api/${type}s/${item._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public: !item.public,
        }),
      })

      if (!response) {
        throw new Error('Empty response from server')
      }

      return response
    },
    onMutate: async () => {
      // Cancel any outgoing re-fetches to prevent them from overwriting optimistic update
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<PreviousData>(queryKey)

      if (previousData) {
        let newData: PreviousData

        if (isInfiniteData(previousData)) {
          // Handle InfiniteData (e.g., Task List, Creation List, Model List)
          newData = {
            ...previousData,
            pages: previousData.pages.map(page => {
              // Handle TasksV2ListResponse with nested results
              if (isTasksV2ListResponse(page)) {
                return {
                  ...page,
                  docs: page?.docs?.map(doc => {
                    if (!isTaskV2(doc)) return doc // TypeScript safety

                    return {
                      ...doc,
                      result: doc.result.map(result => {
                        if (
                          type === 'creation' &&
                          result.creation &&
                          result.creation._id === item._id
                        ) {
                          return {
                            ...result,
                            creation: {
                              ...result.creation,
                              public: !result.creation.public, // Toggle the public status
                            },
                          }
                        }
                        if (
                          type === 'model' &&
                          result.model &&
                          result.model._id === item._id
                        ) {
                          return {
                            ...result,
                            model: {
                              ...result.model,
                              public: !result.model.public, // Toggle the public status
                            },
                          }
                        }
                        return result
                      }),
                    }
                  }),
                }
              }

              // Handle FeedV2CursorResponse or any other types with 'docs' but without 'result'
              return page
            }),
          }
        } else if (type === 'creation' && isCreationData(previousData)) {
          // Handle single CreationV2
          newData = {
            ...previousData,
            public: !previousData.public, // Toggle the public status
          }
        } else if (type === 'model' && isModelData(previousData)) {
          // Handle single ModelV2
          newData = {
            ...previousData,
            public: !previousData.public, // Toggle the public status
          }
        } else {
          // If previousData doesn't match expected structures, do not modify
          newData = previousData
        }

        // Optimistically update the cache
        queryClient.setQueryData(queryKey, newData)
      }

      // Return a context object with a snapshot of previous data
      return { previousData }
    },
    // If the mutation fails, use the context returned from onMutate to rollback
    onError: (err, _variables, context) => {
      console.error('Mutation error:', err)
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      toast.error(`Failed to toggle ${type} privacy`, {
        description: 'Please try again.',
        dismissible: true,
        richColors: true,
      })
    },
    // On success, show a success toast
    onSuccess: (response: ModelsV2PatchResponse | CreationsV2PatchResponse) => {
      const newStatus = isModelsV2PatchResponse(response)
        ? response.model?.public
        : (response as CreationsV2PatchResponse).creation?.public
      toast.success(`${capitalize(type)} Updated`, {
        description: `Set to ${newStatus ? 'public' : 'private'}`,
        dismissible: true,
        richColors: true,
      })
    },
    // After the mutation either succeeds or fails, invalidate the queries to refetch fresh data
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  // Handler to trigger the mutation
  const handleToggle = () => {
    mutation.mutate()
  }

  // Return the handler and the loading state
  return {
    handleToggle,
    isPending: mutation.isPending, // isLoading provides a better indication of the mutation state
  }
}

// Helper function to capitalize the first letter
function capitalize<T extends string>(str: T): Capitalize<T> {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>
}
