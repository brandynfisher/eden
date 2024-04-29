import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import CheckOutlined from '@ant-design/icons/CheckOutlined'
import CloseOutlined from '@ant-design/icons/CloseOutlined'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import { Character } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Divider } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import React, { FC } from 'react'

const CharacterCardFeatures: FC<{ character: Character }> = ({ character }) => {
  const features = [
    {
      label: 'Voice',
      isActive: !!character.voice,
    },
    {
      label: 'Model',
      isActive: !!character.logosData?.concept,
    },
    // {
    //   label: 'Discord',
    //   isActive: !!character.discord,
    // },
  ]

  return (
    <div className="w-full mb-2">
      <div className="flex gap-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center px-2 py-1 border border-solid border-gray-400 dark:border-gray-700 bg-gray-200 dark:bg-gray-900 rounded-md"
          >
            <span className="text-gray-800 dark:text-gray-400 mr-1.5 text-xs">
              {feature.label}
            </span>
            {feature.isActive ? (
              <CheckOutlined className="text-green-400" />
            ) : (
              <CloseOutlined className="text-red-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CharacterCard: FC<{
  character: Character
  // sizes?: string
  className?: string
  showAuthor?: boolean
  showFeatures?: boolean
}> = ({
  character,
  // sizes,
  className,
  showAuthor,
  showFeatures,
}) => {
  return (
    <div
      className={`relative flex flex-col border border-solid border-gray-200 dark:border-gray-800 dark:bg-stone-950 rounded-lg overflow-hidden items-center ${
        className ? className : ''
      }`}
    >
      <Link
        href={`/characters/${character.slug}`}
        className="w-full hover:brightness-110"
      >
        {character.isPrivate ? (
          <div className="absolute top-2 right-2 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center pointer-events-none">
            <LockIcon fontSize="small" className="text-white" />
          </div>
        ) : null}
        {character.image ? (
          <Image
            src={character.image}
            alt={character.name}
            width={248}
            height={248}
            className="object-contain object-center w-full dark:bg-stone-900"
          />
        ) : (
          <div className="w-[248px] h-[248px] flex items-center justify-center">
            <RobotOutlined className="text-9xl text-gray-600" />
          </div>
        )}
        <Divider className="m-0" />
        <div className="px-4 py-2 w-full text-black dark:text-white">
          <div className="flex gap-2 flex-col self-start mb-4">
            <div
              className="font-bold text-ellipsis whitespace-nowrap max-w-full overflow-hidden mt-2"
              title={character.name}
            >
              {character.name}
            </div>
            <div
              className="line-clamp-2 text-gray-300"
              title={character.logosData?.identity}
            >
              {character.logosData?.identity}
            </div>
          </div>
          {showFeatures ? (
            <CharacterCardFeatures character={character} />
          ) : null}
        </div>
      </Link>

      {showAuthor ? (
        <>
          <Divider className="m-0" />
          <div className="flex gap-2 justify-between w-full mt-2 items-center px-2 mb-2">
            <CreatorProfileLink
              creatorId={character.user.userId}
              creatorName={character.user.username}
              creatorImage={character.user.userImage}
            />
            {/*<div>creations: {character.creationCount}</div>*/}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default CharacterCard
