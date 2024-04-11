import { trainingModeColorMap } from '@/components/Concept/ConceptCard/ConceptCard'
import { Concept } from '@edenlabs/eden-sdk'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import { Popover, Tag } from 'antd'
import Link from 'next/link'
import React from 'react'

const ConceptCardFooter = ({ concept }: { concept: Concept }) => {
  const mode = concept?.task?.config?.mode
    ? concept?.task?.config?.mode
    : concept?.task?.config?.concept_mode
    ? concept?.task?.config?.concept_mode
    : null

  return (
    <>
      <Link href={`/create/creations?concept=${concept._id}`}>
        <Popover content="Use this concept" trigger={['hover']}>
          <Tag
            className={`flex items-center first-letter:capitalize me-0 gap-1 !pl-0 !pr-2 bg-gray-300 dark:bg-gray-800 hover:text-blue-400 ${
              concept.creationCount === 0 ? 'text-gray-500' : ''
            }`}
            bordered={false}
            icon={<PlayArrowRounded fontSize="medium" />}
          >
            {concept.creationCount}
          </Tag>
        </Popover>
      </Link>

      {mode ? (
        <Popover content="Concept Training Mode" trigger={['click', 'hover']}>
          <Tag
            color={trainingModeColorMap[mode]}
            className="flex items-center capitalize me-0"
          >
            {mode}
          </Tag>
        </Popover>
      ) : null}
    </>
  )
}

export default ConceptCardFooter
