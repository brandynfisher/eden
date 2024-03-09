import { FilterAltOutlined } from '@mui/icons-material'
import React from 'react'

const FeedFilterTrigger = ({
  onClick,
}: {
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
}) => {
  return (
    <div
      className="flex items-center cursor-pointer text-gray-400 hover:text-gray-200"
      title="Filter"
      onClick={onClick}
    >
      Filter
      <FilterAltOutlined fontSize="medium" className="" />
    </div>
  )
}

export default FeedFilterTrigger
