import { ExperimentOutlined } from '@ant-design/icons'
import { Skeleton } from 'antd'
import React from 'react'

const ImageLoadingPlaceholder = () => {
  return (
    <Skeleton.Node
      active={true}
      className="flex !min-h-[300px] image-loading-placeholder bg-gray-400 dark:bg-black"
    >
      <ExperimentOutlined className="text-2xl" />
    </Skeleton.Node>
  )
}

export default ImageLoadingPlaceholder
