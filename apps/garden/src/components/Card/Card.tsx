import CardImage from '@/components/Card/CardImage'
import CardReactions from '@/components/Card/CardReactions'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import ConceptCardDetail from '@/components/Concept/ConceptCard/ConceptCardDetail'
import ConceptCardFooter from '@/components/Concept/ConceptCard/ConceptCardFooter'
import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import CreationCardMedia from '@/components/Creation/CreationCard/CreationCardMedia'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { handleAxiosError } from '@/lib/fetcher'
import { timeAgo } from '@/lib/time'
import { ItemType } from '@/providers/ModalProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useViewportSize } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import { Button } from '@mui/material'
import { App, Tag } from 'antd'
import axios from 'axios'
import React, { FC, useCallback, useEffect, useState } from 'react'

export interface CardProps {
  index: number
  data: Creation | Concept
  onClick: () => void
  hidePrompt?: boolean
  sizes?: string
  className?: string
}

export type CardWithTypeProps = CardProps & { itemType: ItemType }

const Card: FC<CardWithTypeProps> = ({
  itemType,
  index,
  data,
  onClick,
  hidePrompt,
  sizes,
  className,
}) => {
  const { message } = App.useApp()
  const { hovered, ref } = useHover()
  const { width } = useViewportSize()

  const [itemData, setItemData] = useState<Creation | Concept>(data)
  const [createdDateString, setCreatedDateString] = useState('')
  const [dropdownActive, setDropdownActive] = useState(false)
  const timeSinceCreation = timeAgo(itemData.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(itemData.createdAt).toLocaleString())
  }, [itemData.createdAt])

  const onRestoreClick = useCallback(async () => {
    try {
      await axios.patch(`/api/${itemType}s/${itemData._id}`, {
        update: { deleted: false },
      })
      message.destroy()
      message.success(`${itemType} restored`)

      setItemData({
        ...itemData,
        deleted: false,
      })
    } catch (err) {
      console.log(err)
      handleAxiosError(err, message)
    }
  }, [itemData])

  const cardClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onClick()
    },
    [onClick],
  )

  return (
    <div
      ref={ref}
      className={`w-full flex justify-center flex-col relative ${
        className || ''
      }`}
    >
      <a
        onClick={cardClickHandler}
        href={`/${itemType}s/${itemData._id}`}
        target={'_blank'}
        className={`card-image relative overflow-hidden cursor-pointer block  ${
          itemData.deleted ? 'grayscale' : ''
        } ${itemType === 'concept' ? '' : 'rounded-lg '}`}
      >
        {itemType === 'creation' ? (
          <CreationCardMedia
            creation={itemData as Creation}
            priority={index < 20}
            hovered={hovered}
            sizes={sizes}
          />
        ) : (
          <CardImage
            uri={itemData.thumbnail || ''}
            width={0}
            height={0}
            priority={index < 10}
            sizes={sizes}
            className="!rounded-none !rounded-t-lg"
          />
        )}
      </a>
      {itemData.deleted ? (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
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
      {!itemData.deleted && itemData.isPrivate ? (
        <div
          className={`md:flex items-center absolute right-1 top-1 hidden ${
            hovered ? 'md:hidden' : ''
          }`}
        >
          {itemData.attributes &&
          itemData.attributes.nsfw_score &&
          itemData.attributes.nsfw_score > 0.5 ? (
            <Tag color={'warning'} className="text-xs">
              NSFW
            </Tag>
          ) : null}
          <div
            className={`flex z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none ${
              hovered ? 'md:hidden' : ''
            }`}
          >
            <LockIcon fontSize="small" className="text-white" />
          </div>
        </div>
      ) : null}
      {!itemData.deleted && (width < 768 || hovered || dropdownActive) ? (
        <>
          <div
            className={`order-first md:order-none flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:pb-1 md:pt-0.5 md:px-2 pointer-events-none opacity-0 transition-opacity duration-300 ${
              width ? 'opacity-100' : ''
            }`}
          >
            {!hidePrompt ? (
              <div className="flex items-center pointer-events-auto">
                <CreatorProfileLink
                  creatorId={itemData.user.userId}
                  creatorName={itemData.user.username}
                  creatorImage={itemData.user.userImage}
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
              <>
                {itemData.attributes &&
                itemData.attributes.nsfw_score &&
                itemData.attributes.nsfw_score > 0.5 ? (
                  <Tag
                    color={'warning'}
                    className={`text-xs ${hovered ? 'md:hidden' : ''}`}
                  >
                    NSFW
                  </Tag>
                ) : null}
                {itemData.isPrivate ? <LockIcon fontSize="small" /> : null}
              </>

              <CardToolsDropdown
                onOpen={setDropdownActive}
                item={itemData}
                itemType={itemType}
                onChange={updatedItem => setItemData(updatedItem)}
              />
            </div>
          </div>
          <div
            className={`md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:px-2 pointer-events-none md:hidden ${
              hovered ? 'md:!block' : ''
            } ${
              itemType !== 'creation'
                ? 'pt-2 md:pt-0 md:bottom-10 md:rounded-b-none'
                : ''
            }`}
          >
            <CardReactions
              item={itemData}
              itemType={itemType}
              onChange={updatedCreation =>
                setItemData(updatedCreation as Creation)
              }
              showCounts={true}
            />

            {!hidePrompt ? (
              itemType === 'creation' ? (
                <CreationCardDetail creation={itemData as Creation} />
              ) : (
                <ConceptCardDetail concept={itemData as Concept} />
              )
            ) : null}
          </div>
        </>
      ) : null}

      {itemType === 'concept' ? (
        <div className="absolute flex gap-2 z-10 me-0 bottom-6 right-0 md:bg-gray-100 md:dark:bg-gray-900 md:rounded-b-lg md:bottom-auto md:py-2 md:relative md:w-full md:flex md:justify-between md:px-2">
          <ConceptCardFooter concept={itemData as Concept} />
        </div>
      ) : null}
    </div>
  )
}

export default Card
