// import CharacterAvatar from '@/components/Characters/CharacterAvatar'
// import CommentOutlined from '@ant-design/icons/CommentOutlined'
// import SettingOutlined from '@ant-design/icons/SettingOutlined'
import CharacterCard from '@/components/Characters/CharacterCard'
import CommentOutlined from '@ant-design/icons/CommentOutlined'
import SettingOutlined from '@ant-design/icons/SettingOutlined'
import { Character } from '@edenlabs/eden-sdk'
// import LockIcon from '@mui/icons-material/Lock'
import { Button, Empty } from 'antd'
import Link from 'next/link'
// import Link from 'next/link'
import React from 'react'

// const CharacterListItem = ({ character }: { character: Character }) => {
//   return (
//     <Link
//       href={`/characters/${character.id}`}
//       passHref
//       className="flex justify-between gap-4 cursor-pointer bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-black p-4 rounded-lg text-black dark:text-white"
//     >
//       <div className="flex items-center gap-4">
//         <div className="flex-shrink-0 min-w-0 flex items-center">
//           <CharacterAvatar
//             id={character.id}
//             name={character.name}
//             imageUri={character.image || ''}
//           />
//         </div>
//         <div>
//           <div className="flex gap-2">
//             <div className="font-bold">{character.name}</div>
//             {character.isPrivate ? (
//               <LockIcon fontSize="small" className="text-white" />
//             ) : null}
//           </div>
//           <div
//             className="text-gray-500 line-clamp-2"
//             title={character.description}
//           >
//             {character.description}
//           </div>
//         </div>
//       </div>
//       <div className="flex items-center space-x-4">
//         <Link href={`/characters/chat`}>
//           <Button>
//             <CommentOutlined />
//           </Button>
//         </Link>
//         <Link href={`/create/characters/${character.id}`}>
//           <Button>
//             <SettingOutlined />
//           </Button>
//         </Link>
//       </div>
//     </Link>
//   )
// }

const MyCharacterCard = ({ character }: { character: Character }) => {
  return (
    <div key={character.id}>
      <CharacterCard
        character={character}
        className="!rounded-b-none !border-b-0"
        showAuthor={false}
        showFeatures={true}
      />
      <div className="flex gap-2 px-2 bg-gray-100 dark:bg-gray-800 rounded-b-lg py-2 w-full justify-between ">
        <div className="flex items-center w-full justify-between">
          <Link href={`/characters/chat`}>
            <Button className="flex items-center gap-0.5" type="primary">
              <CommentOutlined />
              Chat
            </Button>
          </Link>
          <Link href={`/create/characters/${character.id}`}>
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
            <MyCharacterCard key={character.id} character={character} />
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
