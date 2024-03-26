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
import {
  Character,
  Collection,
  Concept,
  Creation,
  Creator,
} from '@edenlabs/eden-sdk'
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
  updateHandler?: (data: CardData | Creator | Collection) => void
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
    setItemData(item)
    updateHandler && updateHandler(item)
  }

  return (
    <div
      ref={ref}
      className={`card w-full flex justify-center flex-col relative ${
        className || ''
      }`}
    >
      {itemType !== 'creation' ? (
        <CardHeaderWrap title={itemData.name} onClick={cardClickHandler}>
          <CardToolsDropdown
            onOpen={setDropdownActive}
            item={itemData}
            itemType={itemType}
            onChange={updatedItem => cardUpdateHandler(updatedItem as CardData)}
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
          <>
            <CardImage
              uri={(itemData as Concept).thumbnail || ''}
              width={0}
              height={0}
              priority={index < 10}
              sizes={sizes}
              className="!rounded-none"
            />
            <div className="!bg-opacity-75 absolute bottom-0 dark:bg-gray-900 bg-gray-100 w-full h-9 px-1 flex items-center justify-between">
              <CreatorProfileLink
                creatorId={itemData.user.userId}
                creatorName={itemData.user.username}
                creatorImage={itemData.user.userImage}
              />
              {itemData.isPrivate ? (
                <LockIcon fontSize="small" className="text-white" />
              ) : null}
            </div>
          </>
        ) : null}
        {itemType === 'character' ? (
          <>
            <CardImage
              uri={(itemData as Character).image}
              width={0}
              height={0}
              priority={index < 10}
              sizes={sizes}
              className="!rounded-none w-auto"
            />
            <div className="!bg-opacity-75 absolute bottom-0 dark:bg-gray-900 bg-gray-100 w-full h-9 px-1 flex items-center justify-between">
              <CreatorProfileLink
                creatorId={itemData.user.userId}
                creatorName={itemData.user.username}
                creatorImage={itemData.user.userImage}
              />
              {itemData.isPrivate ? (
                <LockIcon fontSize="small" className="text-white" />
              ) : null}
            </div>
          </>
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
          {itemType === 'creation' ? (
            <div
              className={`flex z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none ${
                hovered ? 'md:hidden' : ''
              }`}
            >
              <LockIcon fontSize="small" className="text-white" />
            </div>
          ) : null}
        </div>
      ) : null}
      {itemType !== 'character' &&
      itemType !== 'concept' &&
      !itemData.deleted &&
      (width < 640 || hovered || dropdownActive) ? (
        <>
          <div
            className={`order-first sm:order-none flex items-center justify-between mb-[12px] sm:absolute md:z-10 sm:w-full sm:top-0 sm:bg-gray-200 sm:dark:bg-gray-900 sm:!bg-opacity-80 sm:rounded-t-lg sm:pb-1 sm:pt-0.5 sm:px-2 pointer-events-none opacity-0 transition-opacity duration-300 ${
              width ? 'opacity-100' : ''
            } ${
              itemType !== 'creation'
                ? 'sm:top-auto sm:bottom-7 !rounded-none'
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
            <div className="flex items-center gap-3 ml-auto my-1">
              {itemType === 'creation' ? (
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
                  onChange={updatedItem =>
                    cardUpdateHandler(updatedItem as CardData)
                  }
                  pageUrl={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${itemData._id}`}
                />
              ) : null}
            </div>
          </div>
          <div
            className={`sm:absolute sm:z-10 sm:w-full sm:bottom-0 sm:bg-gray-200 sm:dark:bg-gray-900 sm:!bg-opacity-80 sm:rounded-b-lg sm:px-2 pointer-events-none sm:hidden ${
              hovered ? 'sm:!block' : ''
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
        <>
          <a
            onClick={cardClickHandler}
            href={`/${itemType}s/${itemData._id}`}
            target={'_blank'}
            className={`cursor-pointer block`}
          >
            <div
              className="line-clamp-2 text-xs text-gray-400 px-2 pt-2 dark:bg-gray-900 bg-gray-100 h-10"
              title={(itemData as Character).logosData?.identity}
            >
              {(itemData as Character).logosData?.identity}
            </div>
          </a>
          <CardFooterWrap>
            <CharacterCardFooter character={itemData as Character} />
          </CardFooterWrap>
        </>
      ) : null}

      {debugMode ? <CardDebugInfo data={itemData} /> : null}
    </div>
  )
}

export default Card
