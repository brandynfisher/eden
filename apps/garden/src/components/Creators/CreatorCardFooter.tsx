import { Creator } from '@edenlabs/eden-sdk'
import { People } from '@mui/icons-material'
import Yard from '@mui/icons-material/Yard'
import { Popover, Tag } from 'antd'
import React from 'react'

const CreatorCardFooter = ({ creator }: { creator: Creator }) => {
  return (
    <>
      <Popover content="Creations made by this user" trigger={['hover']}>
        <Tag
          className={`flex items-center first-letter:capitalize me-0 gap-1 hover:text-blue-400 px-1 ${
            creator.creationCount === 0 ? 'text-gray-500' : ''
          }`}
          bordered={false}
          icon={<Yard fontSize="medium" />}
        >
          {creator.creationCount}
        </Tag>
      </Popover>

      <Popover content="Followers" trigger={['hover']}>
        <Tag
          className={`flex items-center first-letter:capitalize me-0 gap-1 hover:text-blue-400 px-1 ${
            creator.followerCount === 0 ? 'text-gray-500' : ''
          }`}
          bordered={false}
          icon={<People fontSize="medium" />}
        >
          {creator.followerCount}
        </Tag>
      </Popover>
    </>
  )
}

export default CreatorCardFooter
