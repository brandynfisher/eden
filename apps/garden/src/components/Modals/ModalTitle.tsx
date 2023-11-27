import React, { ReactElement } from 'react'

const ModalTitle = ({
  title,
  link,
}: {
  title: string
  link?: ReactElement
}) => {
  return (
    <div className="flex justify-between items-center bg-gray-300 dark:bg-gray-800 !bg-opacity-50 rounded-t-lg h-14 sm:h-11 px-4 py-2 flex-wrap">
      <div className="font-bold flex-shrink-0">{title}</div>
      {link ? (
        <div className="flex justify-end flex-shrink-0 mr-10 lg:mr-6">
          {link}
        </div>
      ) : null}
    </div>
  )
}

export default ModalTitle
