import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import CreationCardMedia from '@/components/Creation/CreationCard/CreationCardMedia'
import CreationReactions from '@/components/Creation/CreationReactions'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { timeAgo } from '@/lib/time'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useViewportSize } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import React, { FC, useCallback, useEffect, useState } from 'react'

const CreationCard: FC<{
  index: number
  data: Creation
  onClick: () => void
}> = ({ index, data, onClick }) => {
  const { hovered, ref } = useHover()
  const { width } = useViewportSize()

  const [creation, setCreation] = useState<Creation>(data)
  const [createdDateString, setCreatedDateString] = useState('')
  const [dropdownActive, setDropdownActive] = useState(false)
  const timeSinceCreation = timeAgo(creation.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(creation.createdAt).toLocaleString())
  }, [creation])

  const cardClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onClick()
    },
    [onClick],
  )

  if (creation.deleted) {
    return (
      <div className="w-full max-h-full dark:text-gray-500 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
        deleted
      </div>
    )
  }

  return (
    <div ref={ref} className="w-full flex justify-center flex-col">
      <a
        onClick={cardClickHandler}
        href={`/creations/${creation._id}`}
        target={'_blank'}
        className="card-image relative rounded-lg overflow-hidden cursor-pointer block"
      >
        <CreationCardMedia
          creation={creation}
          priority={index < 20}
          hovered={hovered}
        />
      </a>
      {creation.isPrivate ? (
        <div
          className={`hidden md:flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none ${
            hovered ? 'md:hidden' : ''
          }`}
        >
          <LockIcon fontSize="small" className="text-white" />
        </div>
      ) : null}
      {width < 768 || hovered || dropdownActive ? (
        <>
          <div
            className={`order-first md:order-none flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none`}
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
                onOpen={setDropdownActive}
                item={creation}
                itemType={'creation'}
                onChange={updatedItem => setCreation(updatedItem as Creation)}
              />
            </div>
          </div>
          <div
            className={`mt-1 md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:pb-2 md:px-2 pointer-events-none`}
          >
            <CreationReactions creation={creation} onChange={setCreation} />
            <CreationCardDetail creation={creation} />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default CreationCard
