import React, { ReactElement } from 'react'

const CardFooterWrap = ({ children }: { children: ReactElement }) => {
  return (
    <div className="flex gap-2 z-10 me-0 bg-gray-100 dark:bg-gray-900 rounded-b-lg py-2 relative w-full justify-between px-2">
      {children}
    </div>
  )
}

export default CardFooterWrap
