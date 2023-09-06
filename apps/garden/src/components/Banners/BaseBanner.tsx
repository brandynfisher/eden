import { CloseOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { ReactNode } from 'react'

const Banner = ({
  children,
  className,
  onClose,
  dismissible = true,
}: {
  children: ReactNode
  className?: string
  onClose?: () => void
  dismissible?: boolean
}) => {
  const handleCloseClick = () => {
    onClose && onClose()
  }

  return (
    <div
      className={`flex justify-center border border-b-1 border-l-0 border-solid border-r-0 border-t-0 border-gray-300 dark:border-gray-700 ${className}`}
    >
      <div className="relative flex w-full max-w-7xl gap-2 items-center justify-center flex-wrap px-4">
        <div className="flex items-center flex-col p-2 flex-shrink-0 sm:w-full">
          {children}
        </div>
        {dismissible ? (
          <Button
            onClick={handleCloseClick}
            className="sm:absolute sm:right-4 mb-4 sm:mb-0"
          >
            <CloseOutlined />
            Dismiss
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default Banner
