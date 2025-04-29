import { IPage } from '@/lib/query/cache-updates'
import { PageData } from '@/lib/query/cache-updates'
import { Agent, CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import {
  QueryClient,
  QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

export const useToggleLikeQuery = ({
  isLiked,
  entityType,
  entityId,
  docQueryKeyId,
}: {
  isLiked: boolean
  entityType: 'creation' | 'model' | 'agent'
  entityId: string
  docQueryKeyId?: string
}) => {
  const queryClient = useQueryClient()

  let apiPath = ''
  let feedQueryKeyPath = ''
  let docQueryKey: QueryKey = []
  if (entityType === 'creation') {
    apiPath = 'creations'
    feedQueryKeyPath = 'creations'
    docQueryKey = ['creations', docQueryKeyId || entityId]
  } else if (entityType === 'model') {
    apiPath = 'models'
    feedQueryKeyPath = 'models'
    docQueryKey = ['models', docQueryKeyId || entityId]
  } else if (entityType === 'agent') {
    apiPath = 'agents'
    feedQueryKeyPath = 'agents'
    docQueryKey = ['agents', docQueryKeyId || entityId]
  }

  const originalData = queryClient.getQueryData(docQueryKey)

  const feedQueries = queryClient.getQueriesData({
    predicate: query => {
      const queryKey = query.queryKey as unknown as Array<unknown>
      return (
        Array.isArray(queryKey) &&
        queryKey.length >= 1 &&
        queryKey[0] === 'feed' &&
        queryKey[1] === feedQueryKeyPath
      )
    },
  })

  const listQueries = queryClient.getQueriesData({
    predicate: query => {
      const queryKey = query.queryKey as unknown as Array<unknown>
      return (
        Array.isArray(queryKey) &&
        queryKey.length >= 1 &&
        queryKey[0] === 'list' &&
        queryKey[1] === feedQueryKeyPath
      )
    },
  })

  const { mutateAsync: toggleLike, isPending } = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await axios.delete(`/api/${apiPath}/${entityId}/likes`)
      } else {
        await axios.post(`/api/${apiPath}/${entityId}/likes`)
      }
    },
    onMutate: () => {
      for (const query of feedQueries) {
        handleMutationForFeed(
          query[1] as PageData<IPage<CreationV2 | ModelV2 | Agent>>,
          queryClient,
          query[0] as QueryKey,
          entityId,
          false,
        )
      }

      for (const query of listQueries) {
        handleMutationForList(
          query[1] as IPage<CreationV2 | ModelV2 | Agent>,
          queryClient,
          query[0] as QueryKey,
          entityId,
          false,
        )
      }

      handleMutationForItem(
        originalData as {
          creation?: CreationV2
          model?: ModelV2
          agent?: Agent
        },
        queryClient,
        docQueryKey,
        entityType,
        false,
      )
    },
    onError: () => {
      for (const query of feedQueries) {
        handleMutationForFeed(
          query[1] as PageData<IPage<CreationV2 | ModelV2 | Agent>>,
          queryClient,
          query[0] as QueryKey,
          entityId,
          true,
        )
      }

      for (const query of listQueries) {
        handleMutationForList(
          query[1] as IPage<CreationV2 | ModelV2 | Agent>,
          queryClient,
          query[0] as QueryKey,
          entityId,
          true,
        )
      }

      handleMutationForItem(
        originalData as {
          creation?: CreationV2
          model?: ModelV2
          agent?: Agent
        },
        queryClient,
        docQueryKey,
        entityType,
        true,
      )

      toast.error(`Could not ${isLiked ? 'unlike' : 'like'} ${entityType}`, {
        description: 'Please try again later',
        dismissible: true,
        richColors: true,
      })
    },
  })

  return { toggleLike, isPending }
}

const handleMutationForFeed = (
  originalData: PageData<IPage<CreationV2 | ModelV2 | Agent>>,
  queryClient: QueryClient,
  queryKey: QueryKey,
  entityId: string,
  isError: boolean,
) => {
  try {
    if (!isError) {
      queryClient.setQueryData(
        queryKey,
        (oldData: PageData<IPage<CreationV2 | ModelV2 | Agent>>) => {
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              docs: page.docs?.map(doc => {
                if (doc._id === entityId) {
                  const likeCount = doc.likeCount || 0
                  return {
                    ...doc,
                    isLiked: !doc.isLiked,
                    likeCount: !doc.isLiked ? likeCount + 1 : likeCount - 1,
                  }
                }
                return doc
              }),
            })),
          }
        },
      )
    } else {
      queryClient.setQueryData(queryKey, () => {
        return originalData
      })
    }
  } catch (error) {
    console.error(error)
  }
}

const handleMutationForItem = (
  originalData: {
    creation?: CreationV2
    model?: ModelV2
    agent?: Agent
  },
  queryClient: QueryClient,
  queryKey: QueryKey,
  entityType: 'creation' | 'model' | 'agent',
  isError: boolean,
) => {
  try {
    const isLiked = originalData[entityType]?.isLiked
    const likeCount = originalData[entityType]?.likeCount || 0

    if (!isError) {
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
              likeCount: !isLiked ? likeCount + 1 : likeCount - 1,
            },
          }
        },
      )
    } else {
      queryClient.setQueryData(queryKey, () => {
        return originalData
      })
    }
  } catch (error) {
    console.error(error)
  }
}

const handleMutationForList = (
  originalData: IPage<CreationV2 | ModelV2 | Agent>,
  queryClient: QueryClient,
  queryKey: QueryKey,
  entityId: string,
  isError: boolean,
) => {
  try {
    if (!isError) {
      queryClient.setQueryData(
        queryKey,
        (oldData: IPage<CreationV2 | ModelV2 | Agent>) => {
          return {
            ...oldData,
            docs: oldData.docs?.map(doc => {
              if (doc._id === entityId) {
                const likeCount = doc.likeCount || 0
                return {
                  ...doc,
                  isLiked: !doc.isLiked,
                  likeCount: !doc.isLiked ? likeCount + 1 : likeCount - 1,
                }
              }
              return doc
            }),
          }
        },
      )
    } else {
      queryClient.setQueryData(queryKey, () => {
        return originalData
      })
    }
  } catch (error) {
    console.error(error)
  }
}
