import { Concept } from '@edenlabs/eden-sdk'
import { Divider } from 'antd'
import React from 'react'

const ConceptCardDetail = ({ concept }: { concept: Concept }) => {
  return (
    <div className="relative">
      <div className="text-sm" title={concept.conceptName}>
        <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
          <strong className="dark:text-gray-200 mr-1">
            /{concept.task?.generator?.generatorName}
          </strong>
          {concept.conceptName}
        </span>
      </div>
      <Divider className="mt-4 mb-5 md:hidden" />
    </div>
  )
}

export default ConceptCardDetail
