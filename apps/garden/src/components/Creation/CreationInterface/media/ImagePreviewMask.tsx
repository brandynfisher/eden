import ExpandOutlined from '@ant-design/icons/ExpandOutlined'
import React from 'react'

const ImagePreviewMask = () => {
  return (
    <div className="image-preview-mask absolute inset-0 !opacity-60 hover:!opacity-100 z-10 max-h-[90vh]">
      <div className="rounded-lg bg-gray-300 dark:bg-gray-800 h-8 w-8 flex items-center justify-center absolute">
        <ExpandOutlined className="text-xl" />
      </div>
    </div>
  )
}

export default ImagePreviewMask
