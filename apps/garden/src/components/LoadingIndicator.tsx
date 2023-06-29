import { LoadingOutlined } from '@ant-design/icons'

const LoadingIndicator = () => {
  return (
    <div className="flex items-center h-full justify-center">
      <div className="flex items-stretch w-full justify-center">
        <div className="flex items-center">
          <LoadingOutlined className="text-3xl" />
          {/*<span className="ml-4">Loading...</span>*/}
        </div>
      </div>
    </div>
  )
}

export default LoadingIndicator
