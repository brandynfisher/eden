import { ReactNode } from 'react'

const CircleButton = ({
  title,
  icon,
  onClick,
}: {
  title: string
  icon: ReactNode
  onClick?: () => void
}) => {
  return (
    <div
      onClick={onClick}
      title={title}
      className="rounded-full hover:bg-gray-200 active:bg-gray-200 hover:dark:bg-gray-800 active:dark:bg-gray-800 h-10 w-10 cursor-pointer flex justify-center items-center"
    >
      {icon}
    </div>
  )
}

export default CircleButton
