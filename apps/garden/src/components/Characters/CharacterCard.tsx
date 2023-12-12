import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import CheckOutlined from '@ant-design/icons/CheckOutlined'
import CloseOutlined from '@ant-design/icons/CloseOutlined'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import { Character } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Divider } from 'antd'
import Image from 'next/image'
import React, { FC } from 'react'

const CharacterCard: FC<{
  character: Character
  // sizes?: string
  className?: string
}> = ({
  character,
  // sizes,
  className,
}) => {
  return (
    // @todo: open modal on card click analog to other places
    <div
      className={`relative flex flex-col border border-solid dark:border-gray-800 dark:bg-stone-950 rounded-lg overflow-hidden items-center ${
        className ? className : ''
      }`}
    >
      {character.isPrivate ? (
        <div className="absolute top-2 right-2 bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center pointer-events-none">
          <LockIcon fontSize="small" className="text-white" />
        </div>
      ) : null}
      {character.image ? (
        <Image
          src={character.image}
          alt={character.name}
          width={256}
          height={256}
          className="object-contain w-full max-h-[256px]"
        />
      ) : (
        <RobotOutlined className="text-6xl text-gray-600" />
      )}
      <div className="px-4 py-2 w-full">
        <div className="flex gap-2 flex-col self-start mb-4">
          <div className="font-bold text-center">{character.name}</div>
          <div className="line-clamp-2">{character.description}</div>
        </div>
        <div className="w-full mb-2">
          <div className="flex gap-2">
            <div className="flex items-center px-2 py-1 border border-solid border-gray-700 bg-gray-800 rounded-md">
              <span className="text-gray-400 mr-1.5 text-xs">Voice</span>
              {character.voice ? (
                <CheckOutlined className="text-green-400" />
              ) : (
                <CloseOutlined className="text-red-400" />
              )}
            </div>
            {/*<div className="flex items-center px-2 py-1 border border-solid border-gray-700 bg-gray-800 rounded-md">*/}
            {/*  <span className="text-gray-400 mr-1.5 text-xs">Discord</span>*/}
            {/*  {character.discord*/}
            {/*    ? <CheckOutlined className="text-green-400" />*/}
            {/*    : <CloseOutlined className="text-red-400" />*/}
            {/*  }*/}
            {/*</div>*/}
            <div className="flex items-center px-2 py-1 border border-solid border-gray-700 bg-gray-800 rounded-md">
              <span className="text-gray-400 mr-1.5 text-xs">Concept</span>
              {character.concept ? (
                <CheckOutlined className="text-green-400" />
              ) : (
                <CloseOutlined className="text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>
      <Divider className="m-0" />
      <div className="flex gap-2 justify-between w-full mt-2 items-center px-2 mb-2">
        {/* todo: dont show profile link if its my own, rather show edit button? */}
        <CreatorProfileLink
          creatorId={character.user.userId}
          creatorName={character.user.username}
          creatorImage={character.user.userImage}
        />
        {/*<div>creations: {character.creationCount}</div>*/}
      </div>
    </div>
  )
}

export default CharacterCard
