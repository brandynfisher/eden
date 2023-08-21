import FollowControls from '@/components/FollowControls'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { Creator } from '@edenlabs/eden-sdk'
import { Empty } from 'antd'

const FollowList = ({ listItems }: { listItems: Creator[] }) => {
  return (
    <div className="flex flex-col w-full">
      {listItems && listItems.length ? (
        listItems.map(listItem => (
          <div
            key={listItem.userId}
            className="flex gap-2 justify-between py-2 px-4 last:mb-0 [&:nth-child(even)]:bg-gray-50 [&:nth-child(odd)]:bg-gray-100 [&:nth-child(even)]:dark:bg-gray-900 [&:nth-child(odd)]:dark:bg-gray-800 "
          >
            <CreatorProfileLink
              creatorId={listItem.userId}
              creatorImage={listItem.userImage}
              creatorName={listItem.username}
            />
            <FollowControls creatorId={listItem.userId} showStats={false} />
          </div>
        ))
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
  )
}

export default FollowList
