import React, { ReactElement } from 'react'

const CardHeaderWrap = ({
  title,
  onClick,
  children,
}: {
  title: string
  onClick?: (ev: React.MouseEvent) => void
  children: ReactElement
}) => {
  return (
    <div className="flex gap-2 me-0 bg-gray-200 dark:bg-gray-900 rounded-t-lg py-2 md:w-full md:justify-between px-2 items-center">
      <div
        onClick={onClick}
        title={title}
        className="text-xs dark:text-gray-300 overflow-hidden whitespace-nowrap self-center truncate cursor-pointer"
      >
        {title}
      </div>
      {children}
    </div>
  )
}

export default CardHeaderWrap
