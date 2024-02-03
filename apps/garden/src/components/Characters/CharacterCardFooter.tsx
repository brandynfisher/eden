import { createSession } from '@/lib/chat'
import CommentOutlined from '@ant-design/icons/CommentOutlined'
import { Character } from '@edenlabs/eden-sdk'
import Yard from '@mui/icons-material/Yard'
import { Button, Popover, Tag } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

const CharacterCardFooter = ({ character }: { character: Character }) => {
  const router = useRouter()

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
      <Popover content="Chat with this character" trigger={['hover']}>
        <Button
          className="flex items-center gap-0.5"
          onClick={() => createSession(character._id, router)}
        >
          <CommentOutlined />
          Chat
        </Button>
      </Popover>
    </>
  )
}

export default CharacterCardFooter
