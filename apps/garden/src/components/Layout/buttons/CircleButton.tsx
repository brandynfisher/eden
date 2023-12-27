import React, { ReactNode } from 'react'

const CircleButton = ({
  title,
  icon,
  onClick,
  disabled,
  className,
}: {
  title: string
  icon: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      title={title}
      className={`rounded-full hover:bg-gray-200 active:bg-gray-200 hover:dark:bg-gray-800 active:dark:bg-gray-800 h-10 w-10 cursor-pointer flex justify-center items-center ${
        disabled
          ? 'text-gray-700 hover:dark:!bg-transparent hover:!bg-transparent !cursor-default'
          : ''
      } ${className ? className : ''}`}
    >
      {icon}
    </div>
  )
}

export default CircleButton
