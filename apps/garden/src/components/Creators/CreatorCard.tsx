import CardFooterWrap from '@/components/Card/CardFooterWrap'
import CardHeaderWrap from '@/components/Card/CardHeaderWrap'
import CardImage from '@/components/Card/CardImage'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import CreatorCardFooter from '@/components/Creators/CreatorCardFooter'
import { CONFIG } from '@/lib/config'
import { Creator } from '@edenlabs/eden-sdk'
import React, { FC, useCallback, useState } from 'react'

interface CardProps {
  index: number
  data: Creator
  onClick?: () => void
  hidePrompt?: boolean
  sizes?: string
  className?: string
  updateHandler?: (data: Creator) => void
}

export type CardWithTypeProps = CardProps

const CreatorCard: FC<CardWithTypeProps> = ({
  index,
  data,
  onClick,
  sizes,
  className,
  updateHandler,
}) => {
  // const { items, setItems } = useContext(MasonryContext)
  const [itemData, setItemData] = useState<Creator>(data)

  const cardClickHandler = useCallback(
    (ev: React.MouseEvent) => {
      if (onClick) {
        ev.preventDefault()
        onClick()
      }
    },
    [onClick],
  )

  const cardUpdateHandler = (item: Creator) => {
    setItemData(item)
    updateHandler && updateHandler(item)
  }

  return (
    <div
      className={`w-full flex justify-center flex-col relative ${
        className || ''
      }`}
    >
      <CardHeaderWrap
        title={itemData.username || itemData.userId}
        onClick={cardClickHandler}
      >
        <CardToolsDropdown
          item={itemData}
          itemType={'creator'}
          onChange={updatedItem => cardUpdateHandler(updatedItem as Creator)}
          pageUrl={`${CONFIG.NEXT_PUBLIC_HOST}/creators/${
            itemData.username || itemData.userId
          }`}
        />
      </CardHeaderWrap>

      <a
        onClick={cardClickHandler}
        href={`/creators/${itemData.username}`}
        target={'_blank'}
        className={`card-image relative overflow-hidden cursor-pointer block`}
      >
        <CardImage
          uri={itemData.userImage}
          width={0}
          height={0}
          priority={index < 10}
          sizes={sizes}
          className="!rounded-none w-auto md:hover:scale-105 md:transition-transform"
        />
      </a>

      <CardFooterWrap>
        <CreatorCardFooter creator={itemData} />
      </CardFooterWrap>
    </div>
  )
}

export default CreatorCard
