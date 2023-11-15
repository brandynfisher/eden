import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import CreationCardMedia from '@/components/Creation/CreationCard/CreationCardMedia'
import CreationReactions from '@/components/Creation/CreationReactions'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { handleAxiosError } from '@/lib/fetcher'
import { timeAgo } from '@/lib/time'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useViewportSize } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import { Button } from '@mui/material'
import { App } from 'antd'
import axios from 'axios'
import React, { FC, useCallback, useEffect, useState } from 'react'

const CreationCard: FC<{
  index: number
  data: Creation
  onClick: () => void
  hidePrompt?: boolean
}> = ({ index, data, onClick, hidePrompt }) => {
  const { message } = App.useApp()
  const { hovered, ref } = useHover()
  const { width } = useViewportSize()

  const [creation, setCreation] = useState<Creation>(data)
  const [createdDateString, setCreatedDateString] = useState('')
  const [dropdownActive, setDropdownActive] = useState(false)
  const timeSinceCreation = timeAgo(creation.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(creation.createdAt).toLocaleString())
  }, [creation])

  const onRestoreClick = useCallback(async () => {
    try {
      await axios.patch(`/api/creations/${creation._id}`, {
        update: { deleted: false },
      })
      message.destroy()
      message.success(`Creation restored`)

      setCreation({
        ...creation,
        deleted: false,
      })
    } catch (err) {
      handleAxiosError(err, message)
    }
  }, [creation])

  const cardClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onClick()
    },
    [onClick],
  )

  return (
    <div ref={ref} className={`w-full flex justify-center flex-col relative`}>
      <a
        onClick={cardClickHandler}
        href={`/creations/${creation._id}`}
        target={'_blank'}
        className={`card-image relative rounded-lg overflow-hidden cursor-pointer block  ${
          creation.deleted ? 'grayscale' : ''
        }`}
      >
        <CreationCardMedia
          creation={creation}
          priority={index < 20}
          hovered={hovered}
        />
      </a>
      {creation.deleted ? (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <Button
            size="small"
            variant="outlined"
            color="warning"
            className="bg-black bg-opacity-50"
            onClick={onRestoreClick}
          >
            Restore
          </Button>
        </div>
      ) : null}
      {!creation.deleted && creation.isPrivate ? (
        <div
          className={`hidden md:flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none ${
            hovered ? 'md:hidden' : ''
          }`}
        >
          <LockIcon fontSize="small" className="text-white" />
        </div>
      ) : null}
      {!creation.deleted && (width < 768 || hovered || dropdownActive) ? (
        <>
          <div
            className={`order-first md:order-none flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none opacity-0 transition-opacity duration-300 ${
              width ? 'opacity-100' : ''
            }`}
          >
            {!hidePrompt ? (
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
            ) : null}
            <div className="flex items-center gap-4 ml-auto my-1">
              {creation.isPrivate ? <LockIcon fontSize="small" /> : null}
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
            <CreationReactions
              creation={creation}
              onChange={updatedCreation =>
                setCreation(updatedCreation as Creation)
              }
              showCounts={true}
            />
            {!hidePrompt ? <CreationCardDetail creation={creation} /> : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default CreationCard
