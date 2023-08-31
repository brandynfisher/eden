import { Spin } from 'antd'

const FetchIndicator = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div
      className={`${
        isLoading ? 'anim-fade-in' : 'anim-fade-out'
      } z-10 pointer-events-none bg-opacity-60`}
    >
      <div className="text-xs flex bg-gray-200 dark:bg-gray-800 p-2 !bg-opacity-80 rounded-lg">
        <Spin size="small" />
      </div>
    </div>
  )
}

export default FetchIndicator
