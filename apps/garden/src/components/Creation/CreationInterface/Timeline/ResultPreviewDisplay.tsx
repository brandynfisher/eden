import LoadingIndicator from '@/components/LoadingIndicator'
import MediaDisplay from '@/components/MediaDisplay'
import { useCreation } from '@/hooks/useCreation'
import { getAspectRatio } from '@/lib/media'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
// import StarOutline from '@mui/icons-material/StarOutline'
// import StarRate from '@mui/icons-material/StarRate'
// import Rating from '@mui/material/Rating'
// import { App } from 'antd'
// import axios from 'axios'
import React from 'react'

// import ResultTools from '@/components/Creation/CreationInterface/ResultTools'

const ResultPreviewDisplay = ({
  creationId,
  priority,
}: {
  creationId: string
  priority?: boolean
}) => {
  const {
    creation,
    // mutate: refetch,
    isLoading,
  } = useCreation(creationId, {
    shouldRetryOnError: false,
  })
  const { showModal } = useModalContext()
  // const { message } = App.useApp()
  // const [ratingValue, setRatingValue] = useState(0)

  // useEffect(() => {
  //   if (creation) {
  //     // @ts-ignore
  //     setRatingValue(creation.rating || 0)
  //   }
  // }, [creation])

  const openDetailModal = async () => {
    if (!creation) return

    showModal(MODAL_TYPES.DETAIL_STATIC_MODAL, {
      item: creation ? creation : undefined,
      itemType: 'creation',
      usesUrl: true,
    })
  }

  // const handleRatingSelect = useCallback(
  //   async (newValue: number) => {
  //     message.destroy()
  //
  //     try {
  //       setRatingValue(newValue)
  //       await axios.post('/api/creations/rate', {
  //         creationId: creationId,
  //         rating: newValue,
  //       })
  //       refetch()
  //       message.success(`Rating updated`)
  //     } catch (e) {
  //       message.error(`Rating update failed`)
  //     }
  //   },
  //   [creationId],
  // )

  return (
    <>
      {creation === null ? (
        <div className="h-64 w-64 max-w-full max-h-full dark:text-gray-500 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
          deleted
        </div>
      ) : null}
      {creation ? (
        <div>
          <div onClick={openDetailModal} className="cursor-pointer w-full">
            <MediaDisplay
              creationUri={creation.uri}
              previewUri={creation.uri}
              thumbnailUri={creation.thumbnail}
              aspectRatio={getAspectRatio(
                creation.mediaAttributes.width,
                creation.mediaAttributes.height,
              )}
              priority={priority}
              limitHeight={true}
            />
          </div>
          {/*<Rating*/}
          {/*  className="mt-2"*/}
          {/*  name="rating-small"*/}
          {/*  value={ratingValue}*/}
          {/*  size="small"*/}
          {/*  icon={<StarRate className="text-gray-400" fontSize="small" />}*/}
          {/*  emptyIcon={*/}
          {/*    <StarOutline className="text-gray-700" fontSize="small" />*/}
          {/*  }*/}
          {/*  onChange={async (event, newValue) => {*/}
          {/*    await handleRatingSelect(newValue || 0)*/}
          {/*  }}*/}
          {/*/>*/}
          {/*<ResultTools creation={creation}/>*/}
        </div>
      ) : (
        <>{isLoading ? <LoadingIndicator /> : null}</>
      )}
    </>
  )
}

export default ResultPreviewDisplay
