import CharacterAvatarFallback from '@/components/Characters/CharacterAvatarFallback'
import { Character } from '@edenlabs/eden-sdk'
import { Image } from 'antd'
import React from 'react'

const CharacterAvatar = ({
  character,
  size,
}: {
  character: Character
  size?: 'small'
}) => {
  return (
    <div
      className={`overflow-hidden flex items-center justify-center ${
        size === 'small' ? 'rounded' : 'rounded-lg w-14 h-14'
      }`}
    >
      {character.avatarImageUri ? (
        <Image src={''} alt={`${character.name}'s Avatar`} preview={false} />
      ) : (
        <CharacterAvatarFallback character={character} size={size} />
      )}
    </div>
  )
}

export default CharacterAvatar
