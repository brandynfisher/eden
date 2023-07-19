import { Button } from 'antd'
import React, { ReactNode, useState } from 'react'

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

export const OrderByPraises: OrderByParam = {
  label: 'Praises',
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
      className={`h-auto !text-xs px-4 text-black bg-gray-200 dark:text-gray-300 dark:bg-gray-900 hover:!text-gray-100 hover:!bg-gray-500  hover:dark:!bg-gray-800 ${
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
  onOrderChange,
}: {
  params: OrderByParam[]
  onOrderChange: (item: OrderByParam) => void
}) => {
  const [selectedParam, setSelectedParam] = useState<OrderByParam>(params[0])

  const handleSelect = (item: OrderByParam) => {
    if (selectedParam.field === item.field) return
    setSelectedParam(item)
    onOrderChange(item)
  }

  return (
    <div className="mb-4 flex gap-2">
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
