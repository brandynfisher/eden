import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import { Skeleton } from 'antd'
import React from 'react'

const ImageLoadingPlaceholder = () => {
  return (
    <Skeleton.Node
      active={true}
      className="flex image-loading-placeholder justify-center items-center bg-gray-400 dark:bg-black"
    >
      <ExperimentOutlined className="text-xl" />
    </Skeleton.Node>
  )
}

export default ImageLoadingPlaceholder
