import { Creation } from '@edenlabs/eden-sdk'
import { Divider } from 'antd'
import React from 'react'

const CreationCardDetail = ({ creation }: { creation: Creation }) => {
  return (
    <div className="relative">
      <div className="text-sm" title={creation.name}>
        <span className="inline relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
          <strong className="dark:text-gray-200 mr-1">
            /{creation.task?.generator?.generatorName}
          </strong>
          {creation.name}
        </span>
      </div>
      <Divider className="mt-4 mb-5 md:hidden" />
    </div>
  )
}

export default CreationCardDetail
