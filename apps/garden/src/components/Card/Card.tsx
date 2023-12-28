import CardDebugInfo from '@/components/Card/CardDebugInfo'
import CardFooterWrap from '@/components/Card/CardFooterWrap'
import CardHeaderWrap from '@/components/Card/CardHeaderWrap'
import CardImage from '@/components/Card/CardImage'
import CardReactions from '@/components/Card/CardReactions'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import CharacterCardFooter from '@/components/Characters/CharacterCardFooter'
import ConceptCardFooter from '@/components/Concept/ConceptCard/ConceptCardFooter'
import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import CreationCardMedia from '@/components/Creation/CreationCard/CreationCardMedia'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import { timeAgo } from '@/lib/time'
import { ItemType } from '@/providers/ModalProvider'
import { Character, Concept, Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { useViewportSize } from '@mantine/hooks'
import LockIcon from '@mui/icons-material/Lock'
import { Button } from '@mui/material'
import { App, Tag } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { FC, useCallback, useEffect, useState } from 'react'

export type CardData = Creation | Concept | Character

export interface CardProps {
  index: number
  data: CardData
  onClick: () => void
  hidePrompt?: boolean
  sizes?: string
  className?: string
  updateHandler?: (data: CardData) => void
}

export type CardWithTypeProps = CardProps & { itemType: ItemType }

const NsfwBadge = ({
  item,
  className,
}: {
  item: Creation | Concept
  className?: string
}) => {
  return typeof item.attributes !== 'undefined' &&
    item.attributes &&
    item.attributes.nsfw_score &&
    item.attributes.nsfw_score > 0.5 ? (
    <Tag color={'warning'} className={`text-xs ${className ? className : ''}`}>
      NSFW
    </Tag>
  ) : null
}

const Card: FC<CardWithTypeProps> = ({
  itemType,
  index,
  data,
  onClick,
  hidePrompt,
  sizes,
  className,
  updateHandler,
}) => {
  const router = useRouter()
  const [debugMode, setDebugMode] = useState<boolean>(false)
  useEffect(() => {
    setDebugMode(!!(router.query && router.query.debug))
  }, [router.query])

  const { message } = App.useApp()
  const { hovered, ref } = useHover()
  const { width } = useViewportSize()

  const [itemData, setItemData] = useState<CardData>(data)
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

      const updatedItem = {
        ...itemData,
        deleted: false,
      }
      setItemData(updatedItem)
      updateHandler && updateHandler(updatedItem)
    } catch (err) {
      console.log(err)
      handleAxiosError(err, message)
    }
  }, [itemData, itemType])

  const cardClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault()
      onClick()
    },
    [onClick],
  )

  const cardUpdateHandler = (item: CardData) => {
    console.log('cardUpdate', item)
    setItemData(item)
    updateHandler && updateHandler(item)
  }

  return (
    <div
      ref={ref}
      className={`w-full flex justify-center flex-col relative ${
        className || ''
      }`}
    >
      {itemType !== 'creation' ? (
        <CardHeaderWrap title={itemData.name} onClick={cardClickHandler}>
          <CardToolsDropdown
            onOpen={setDropdownActive}
            item={itemData}
            itemType={itemType}
            onChange={(updatedItem: CardData) => cardUpdateHandler(updatedItem)}
            pageUrl={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${itemData._id}`}
          />
        </CardHeaderWrap>
      ) : null}
      <a
        onClick={cardClickHandler}
        href={`/${itemType}s/${itemData._id}`}
        target={'_blank'}
        className={`card-image relative overflow-hidden cursor-pointer block  ${
          itemData.deleted ? 'grayscale' : ''
        } ${itemType === 'creation' ? 'rounded-lg' : ''}`}
      >
        {itemType === 'creation' ? (
          <CreationCardMedia
            creation={itemData as Creation}
            priority={index < 20}
            hovered={hovered}
            sizes={sizes}
          />
        ) : null}
        {itemType === 'concept' ? (
          <CardImage
            uri={(itemData as Concept).thumbnail || ''}
            width={0}
            height={0}
            priority={index < 10}
            sizes={sizes}
            className="!rounded-none"
          />
        ) : null}
        {itemType === 'character' ? (
          <CardImage
            uri={(itemData as Character).image}
            width={0}
            height={0}
            priority={index < 10}
            sizes={sizes}
            className="!rounded-none w-auto"
          />
        ) : null}
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
          {itemType === 'creation' || itemType === 'concept' ? (
            <NsfwBadge item={itemData as Creation | Concept} />
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
            } ${
              itemType !== 'creation'
                ? 'md:top-auto md:bottom-7 !rounded-none'
                : ''
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
              {itemType === 'creation' || itemType === 'concept' ? (
                <NsfwBadge
                  item={itemData as Creation | Concept}
                  className={`text-xs ${hovered ? 'md:hidden' : ''}`}
                />
              ) : null}
              {itemData.isPrivate ? <LockIcon fontSize="small" /> : null}

              {itemType === 'creation' ? (
                <CardToolsDropdown
                  onOpen={setDropdownActive}
                  item={itemData}
                  itemType={itemType}
                  onChange={(updatedItem: CardData) =>
                    cardUpdateHandler(updatedItem)
                  }
                  pageUrl={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${itemData._id}`}
                />
              ) : null}
            </div>
          </div>
          <div
            className={`md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:px-2 pointer-events-none md:hidden ${
              hovered ? 'md:!block' : ''
            }`}
          >
            <CardReactions
              item={itemData}
              itemType={itemType}
              onChange={(updatedItem: CardData) =>
                cardUpdateHandler(updatedItem)
              }
              showCounts={true}
            />

            {!hidePrompt && itemType === 'creation' ? (
              <CreationCardDetail creation={itemData as Creation} />
            ) : null}
          </div>
        </>
      ) : null}

      {itemType === 'concept' ? (
        <CardFooterWrap>
          <ConceptCardFooter concept={itemData as Concept} />
        </CardFooterWrap>
      ) : null}

      {itemType === 'character' ? (
        <CardFooterWrap>
          <CharacterCardFooter character={itemData as Character} />
        </CardFooterWrap>
      ) : null}

      {debugMode ? <CardDebugInfo data={itemData} /> : null}
    </div>
  )
}

export default Card
