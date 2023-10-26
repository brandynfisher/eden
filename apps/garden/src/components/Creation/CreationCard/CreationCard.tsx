import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import MediaPreview from '@/components/Creation/CreationInterface/media/MediaPreview'
import LoadingIndicator from '@/components/LoadingIndicator'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { getAspectRatio } from '@/lib/media'
import { timeAgo } from '@/lib/time'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import dynamic from 'next/dynamic'
import React, { FC, useEffect, useState } from 'react'

const CardToolsDropdown = dynamic(
  () => import('@/components/Card/CardToolsDropdown'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationReactions = dynamic(
  () => import('@/components/Creation/CreationReactions'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreationCard: FC<{
  index: number
  data: Creation
  // disableArrowNav?: boolean
  onClick: () => void
}> = ({
  index,
  data,
  // disableArrowNav,
  onClick,
}) => {
  const { hovered, ref } = useHover()
  const [creation, setCreation] = useState<Creation>(data)

  const [createdDateString, setCreatedDateString] = useState('')
  const timeSinceCreation = timeAgo(creation.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(creation.createdAt).toLocaleString())
  }, [creation])

  return (
    <div ref={ref} className="mx-auto max-w-[500px] md:mx-0 md:max-w-none">
      {creation.deleted ? (
        <div className="h-64 w-64 max-w-full max-h-full dark:text-gray-500 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
          deleted
        </div>
      ) : (
        <>
          <div className="relative" key={`${index}_${creation._id}`}>
            <div className="w-full flex justify-center flex-col">
              <div
                className="card-image relative rounded-lg overflow-hidden cursor-pointer"
                onClick={onClick}
              >
                <a
                  onClick={ev => ev.preventDefault()}
                  href={`/creations/${creation._id}`}
                  target={'_blank'}
                  className="block"
                >
                  <MediaPreview
                    creation={creation}
                    hovered={hovered}
                    aspectRatio={getAspectRatio(
                      creation.mediaAttributes.width,
                      creation.mediaAttributes.height,
                    )}
                    priority={true}
                  />
                </a>
              </div>
              {creation.isPrivate ? (
                <div
                  className={`hidden md:flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none ${
                    hovered ? '!hidden' : ''
                  }`}
                >
                  <LockIcon fontSize="small" className="text-white" />
                </div>
              ) : null}
              <div
                className={`order-first md:order-none flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none ${
                  hovered ? 'md:!visible' : 'md:hidden'
                }`}
              >
                <div className="flex items-center pointer-events-auto my-1">
                  <CreatorProfileLink
                    creatorId={creation.user.userId}
                    creatorName={creation.user.username}
                    creatorImage={creation.user.userImage}
                  />
                  <div
                    className="text-gray-700 dark:text-gray-400 text-xs"
                    title={createdDateString}
                  >
                    <span className="mx-1">•</span>
                    {timeSinceCreation}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {creation.isPrivate ? (
                    <LockIcon fontSize="small" className="md:hidden" />
                  ) : null}
                  <CardToolsDropdown
                    item={creation}
                    itemType={'creation'}
                    onChange={updatedItem =>
                      setCreation(updatedItem as Creation)
                    }
                  />
                </div>
              </div>
              <div
                className={`mt-1 md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:pb-2 md:px-2 pointer-events-none ${
                  hovered ? 'md:!visible' : 'md:hidden'
                }`}
              >
                <CreationReactions creation={creation} onChange={setCreation} />
                <CreationCardDetail creation={creation} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CreationCard
