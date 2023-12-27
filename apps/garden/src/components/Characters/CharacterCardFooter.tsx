import CommentOutlined from '@ant-design/icons/CommentOutlined'
import { Character } from '@edenlabs/eden-sdk'
import Yard from '@mui/icons-material/Yard'
import { Popover, Tag } from 'antd'
import React from 'react'

const CharacterCardFooter = ({ character }: { character: Character }) => {
  return (
    <>
      <Popover content="Creations made by this character" trigger={['hover']}>
        <Tag
          className={`flex items-center first-letter:capitalize me-0 gap-1 hover:text-blue-400 px-1 ${
            character.creationCount === 0 ? 'text-gray-500' : ''
          }`}
          bordered={false}
          icon={<Yard fontSize="medium" />}
        >
          {character.creationCount}
        </Tag>
      </Popover>
      <Popover content="Chats with this character" trigger={['hover']}>
        <Tag
          className={`flex items-center first-letter:capitalize me-0 gap-1 hover:text-blue-400 px-1 ${
            character.creationCount === 0 ? 'text-gray-500' : ''
          }`}
          bordered={false}
          icon={<CommentOutlined className="text-xl me-0" />}
        >
          <div>{character.creationCount}</div>
        </Tag>
      </Popover>
    </>
  )
}

export default CharacterCardFooter
