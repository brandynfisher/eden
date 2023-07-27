import CharacterAvatarFallback from '@/components/Characters/CharacterAvatarFallback'
import { Character } from '@edenlabs/eden-sdk'
import { Image } from 'antd'
import React from 'react'

const CharacterAvatar = ({ character }: { character: Character }) => {
  return (
    <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center">
      {character.avatarImageUri ? (
        <Image src={''} alt={`${character.name}'s Avatar`} preview={false} />
      ) : (
        <CharacterAvatarFallback character={character} />
      )}
    </div>
  )
}

export default CharacterAvatar
