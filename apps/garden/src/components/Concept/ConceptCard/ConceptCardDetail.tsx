import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const ConceptCardDetail = ({ concept }: { concept: Concept }) => {
  return (
    <div className="relative">
      <div className="text-sm" title={concept.conceptName}>
        <span className="relative first-letter:uppercase text-xs select-text cursor-text mb-2 text-ellipsis dark:text-gray-400 break-words line-clamp-2">
          {/*<strong className="dark:text-gray-200 mr-1">*/}
          {concept.conceptName}
          {/*</strong>*/}
          {/*{concept.name}*/}
        </span>
      </div>
    </div>
  )
}

export default ConceptCardDetail
