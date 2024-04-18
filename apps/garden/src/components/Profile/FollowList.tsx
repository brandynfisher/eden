import FollowControls from '@/components/FollowControls'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useFollowingPaginated } from '@/hooks/useFollowingPaginated'
import { Button, Empty } from 'antd'
import { useEffect } from 'react'

const FollowList = ({
  creatorId,
  type,
  setItemCount,
}: {
  creatorId: string
  type: 'followers' | 'following'
  setItemCount: (count: number) => void
}) => {
  const {
    items: listItems,
    isLoadingMore,
    isReachingEnd,
    setSize,
    size,
    totalItemCount,
  } = useFollowingPaginated({ userId: creatorId, type })

  useEffect(() => {
    setItemCount(totalItemCount)
  }, [setItemCount, totalItemCount])

  return (
    <div>
      <div className="flex flex-col w-full">
        {listItems && listItems.length > 0 ? (
          <>
            {listItems.map(listItem => (
              <div
                key={listItem.userId}
                className="relative flex gap-2 justify-between py-2 px-4 last:mb-0 [&:nth-child(even)]:bg-gray-50 [&:nth-child(odd)]:bg-gray-100 [&:nth-child(even)]:dark:bg-gray-900 [&:nth-child(odd)]:dark:bg-gray-800 flex-wrap"
              >
                <CreatorProfileLink
                  creatorId={listItem.userId}
                  creatorImage={listItem.userImage}
                  creatorName={listItem.username}
                />
                <div className="absolute self-center h-full right-2">
                  <FollowControls
                    creatorId={listItem._id}
                    creator={listItem}
                    showStats={false}
                  />
                </div>
              </div>
            ))}
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing here yet.</div>
              </div>
            }
          />
        )}
      </div>

      {listItems && listItems.length && !isReachingEnd ? (
        <Button
          className="mt-4"
          disabled={isLoadingMore || isReachingEnd}
          onClick={() => setSize(size + 1)}
        >
          {isLoadingMore
            ? 'loading...'
            : isReachingEnd
            ? 'no more items'
            : 'Load more'}
        </Button>
      ) : null}
    </div>
  )
}

export default FollowList
