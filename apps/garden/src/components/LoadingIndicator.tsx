import { LoadingOutlined } from '@ant-design/icons'
import { ReactNode } from 'react'

const LoadingIndicator = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex inset-0 items-center h-full w-full justify-center">
      <div className="flex items-stretch w-full justify-center">
        <div className="flex items-center gap-4">
          <LoadingOutlined className="text-2xl" />
          {children}
        </div>
      </div>
    </div>
  )
}

export default LoadingIndicator
