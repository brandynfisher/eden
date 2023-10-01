import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { SettingOutlined } from '@ant-design/icons'
import { Character } from '@edenlabs/eden-sdk'
import { Button, Empty } from 'antd'
import Link from 'next/link'

const CharacterListItem = ({ character }: { character: Character }) => {
  return (
    <Link
      href={`/characters/${character.id}`}
      passHref
      className="flex gap-4 cursor-pointer bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-black p-4 rounded-lg text-black dark:text-white"
    >
      <div className="flex-shrink-0 min-w-0 flex items-center">
        <CharacterAvatar
          id={character.id}
          name={character.name}
          imageUri={character.image || ''}
          size="large"
        />
      </div>
      <div>
        <div className="font-bold">{character.name}</div>
        <div
          className="text-gray-500 line-clamp-2"
          title={character.description}
        >
          {character.description}
        </div>
      </div>
      <div className="flex items-center">
        <Button>
          <SettingOutlined />
        </Button>
      </div>
    </Link>
  )
}

const CharacterList = ({ characters }: { characters: Character[] }) => {
  return (
    <div className="flex flex-col gap-4">
      {characters && characters.length ? (
        characters.map(character => (
          <CharacterListItem key={character.id} character={character} />
        ))
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
