import React, { ReactElement } from 'react'

const CardHeaderWrap = ({
  title,
  children,
}: {
  title: string
  children: ReactElement
}) => {
  return (
    <div className="flex gap-2 me-0 bg-gray-100 dark:bg-gray-900 rounded-t-lg py-2 md:w-full md:justify-between px-2">
      <div
        title={title}
        className="text-xs dark:text-gray-300 overflow-hidden whitespace-nowrap self-center truncate"
      >
        {title}
      </div>
      {children}
    </div>
  )
}

export default CardHeaderWrap
