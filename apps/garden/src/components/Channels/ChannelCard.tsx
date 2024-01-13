import CardImage from '@/components/Card/CardImage'
import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import React from 'react'

const ChannelCard = ({
  itemType,
  orderBy,
}: {
  itemType: ItemType
  orderBy: OrderByParam
}) => {
  const { showModal } = useModalContext()
  const onChannelCardClick = () => {
    showModal(MODAL_TYPES.CHANNEL_DETAIL_MODAL, {
      usesUrl: false,
      itemType,
      orderBy,
    })
  }

  return (
    <div
      className={`
        flex-shrink-0
        border
        border-solid 
        rounded-lg 
        border-gray-300
        dark:border-gray-600 
        hover:border-blue-500 
        cursor-pointer 
        transition-colors
        duration-200 
        transform
        overflow-hidden`}
    >
      <div className="cursor-pointer" onClick={onChannelCardClick}>
        <div className="text-center bg-gray-200 dark:bg-gray-900 py-1">
          <div>{orderBy.label}</div>
        </div>
        <div>
          <CardImage uri="" width={300} height={300} />
        </div>
      </div>
    </div>
  )
}

export default ChannelCard
