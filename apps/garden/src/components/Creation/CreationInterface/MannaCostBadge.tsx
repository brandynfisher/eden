import LoadingOutlined from '@ant-design/icons/LoadingOutlined'

const MannaCostEstimate = ({
  isLoading,
  cost,
}: {
  isLoading?: boolean
  cost: string | number
}) => {
  return (
    <>
      {(isLoading || cost) && (
        <div className="flex ml-2 text-xs items-center gap-2 font-mono text-gray-300 bg-black bg-opacity-30 px-2 py-1.5 rounded pointer-events-none">
          <div className="cursor-default">
            {isLoading ? <LoadingOutlined /> : <span>-{cost} Manna</span>}
          </div>
        </div>
      )}
    </>
  )
}

export default MannaCostEstimate
