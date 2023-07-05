import { Button } from 'antd'
import React, { ReactNode, useState } from 'react'

type OrderByParam = {
  label: string
  field: string
  direction: -1 | 1
}

const items: OrderByParam[] = [
  {
    label: 'Latest',
    field: 'createdAt',
    direction: -1,
  },
  {
    label: 'Praises',
    field: 'praisesCount',
    direction: -1,
  },
]

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
      className={`h-auto !text-xs px-4 text-black bg-gray-200 dark:text-gray-300 hover:!text-gray-100 hover:!bg-gray-500 dark:bg-gray-900 hover:dark:!bg-gray-800 ${
        isActive
          ? 'text-white bg-gray-900 dark:bg-gray-700 hover:dark:!bg-gray-700 hover:!bg-gray-500'
          : ''
      }`}
    >
      {children}
    </Button>
  )
}

const OrderByButtons = () => {
  const [selectedParam, setSelectedParam] = useState<OrderByParam>(items[0])

  return (
    <div className="mb-4 flex gap-2">
      {items.map(item => (
        <OrderByButton
          key={item.field}
          isActive={item.field === selectedParam?.field}
          onSelect={() => setSelectedParam(item)}
        >
          {item.label}
        </OrderByButton>
      ))}
    </div>
  )
}

export default OrderByButtons
