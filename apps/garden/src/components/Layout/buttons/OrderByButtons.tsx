import { Button } from 'antd'
import React, { ReactNode, useEffect, useState } from 'react'

export type OrderByParam = {
  label: string
  field: string
  direction: -1 | 1
}

export const OrderByLatest: OrderByParam = {
  label: 'Latest',
  field: 'createdAt',
  direction: -1,
}

export const OrderByPopularity: OrderByParam = {
  label: 'Popular',
  field: 'popularity',
  direction: -1,
}

export const OrderByUsage: OrderByParam = {
  label: 'Most Creations',
  field: 'creationCount',
  direction: -1,
}

export const OrderByLikedByMe: OrderByParam = {
  label: 'Likes',
  field: 'liked',
  direction: -1,
}

export const OrderByPraises: OrderByParam = {
  label: 'Likes',
  field: 'praiseCount',
  direction: -1,
}

export const OrderByBookmarks: OrderByParam = {
  label: 'Bookmarks',
  field: 'bookmarkCount',
  direction: -1,
}

export const OrderByFollowing: OrderByParam = {
  label: 'Following',
  field: 'following',
  direction: -1,
}

export const OrderByFollowers: OrderByParam = {
  label: 'Most Followed',
  field: 'followerCount',
  direction: -1,
}

export const OrderByScore: OrderByParam = {
  label: 'Recommended',
  field: 'embedding.score',
  direction: -1,
}

export const OrderByDefaultParam = OrderByLatest

const OrderByButton = ({
  children,
  isActive,
  onSelect,
}: {
  children: ReactNode
  isActive: boolean
  onSelect: () => void
}) => {
  return (
    <Button
      onClick={onSelect}
      className={`font-mono h-auto !text-xs px-3 text-black dark:text-gray-300 hover:!text-gray-100 bg-gray-200 dark:bg-gray-900 hover:!bg-gray-500 hover:dark:!bg-gray-800 ${
        isActive
          ? 'text-white bg-gray-900 hover:!bg-gray-500 hover:dark:!bg-gray-700 dark:!bg-gray-700'
          : ''
      }`}
    >
      {children}
    </Button>
  )
}

const OrderByButtons = ({
  params,
  initialParam,
  onOrderChange,
}: {
  params: OrderByParam[]
  initialParam?: OrderByParam
  onOrderChange: (item: OrderByParam) => void
}) => {
  const [selectedParam, setSelectedParam] = useState<OrderByParam>(
    initialParam ? initialParam : params[0],
  )

  useEffect(() => {
    setSelectedParam(initialParam || params[0])
  }, [initialParam])

  const handleSelect = (item: OrderByParam) => {
    if (selectedParam.field === item.field) return
    setSelectedParam(item)
    onOrderChange(item)
  }

  return (
    <div className="mb-4 flex gap-2 flex-wrap items-center">
      {params.map(item => (
        <OrderByButton
          key={item.field}
          isActive={item.field === selectedParam?.field}
          onSelect={() => handleSelect(item)}
        >
          {item.label}
        </OrderByButton>
      ))}
    </div>
  )
}

export default OrderByButtons
