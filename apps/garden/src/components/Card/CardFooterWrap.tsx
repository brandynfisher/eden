import React, { ReactElement } from 'react'

const CardFooterWrap = ({ children }: { children: ReactElement }) => {
  return (
    <div className="absolute flex gap-2 z-10 me-0 bottom-6 right-0 md:bg-gray-100 md:dark:bg-gray-900 md:rounded-b-lg md:bottom-auto md:py-2 md:relative md:w-full md:flex md:justify-between md:px-2">
      {children}
    </div>
  )
}

export default CardFooterWrap
