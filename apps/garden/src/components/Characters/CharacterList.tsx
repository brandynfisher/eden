import CharacterCard from '@/components/Characters/CharacterCard'
import { createSession } from '@/lib/chat'
import CommentOutlined from '@ant-design/icons/CommentOutlined'
import SettingOutlined from '@ant-design/icons/SettingOutlined'
import { Character } from '@edenlabs/eden-sdk'
import { Button, Empty } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const MyCharacterCard = ({ character }: { character: Character }) => {
  const router = useRouter()

  return (
    <div key={character._id} className="w-[250px]">
      <CharacterCard
        character={character}
        className="!rounded-b-none !border-b-0"
        showAuthor={false}
        showFeatures={true}
      />
      <div className="flex gap-2 px-2 bg-gray-100 dark:bg-gray-800 rounded-b-lg py-2 w-full justify-between ">
        <div className="flex items-center w-full justify-between">
          <Button
            className="flex items-center gap-0.5"
            type="primary"
            onClick={() => createSession(character._id, router)}
          >
            <CommentOutlined />
            Chat
          </Button>
          <Link href={`/create/characters/${character._id}`}>
            <Button className="flex items-center gap-0.5">
              <SettingOutlined />
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const CharacterList = ({ characters }: { characters: Character[] }) => {
  return (
    <div className="flex flex-col gap-4">
      {characters && characters.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 space-x-4 space-y-4">
          {characters.map(character => (
            <MyCharacterCard key={character._id} character={character} />
          ))}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="flex flex-col items-center">
              <div className="mb-4">Nothing here yet.</div>
            </div>
          }
        />
      )}
    </div>
  )
}

export default CharacterList
