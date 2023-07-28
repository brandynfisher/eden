import CharacterAvatarFallback from '@/components/Characters/CharacterAvatarFallback'
import { Image } from 'antd'
import React from 'react'

const CharacterAvatar = ({
  id,
  name,
  imageUri,
  size,
}: {
  id: string
  name: string
  imageUri: string
  size?: 'small'
}) => {
  return (
    <div
      className={`overflow-hidden flex items-center justify-center ${
        size === 'small' ? 'rounded-full h-full w-full' : 'rounded-lg w-14 h-14'
      }`}
    >
      {imageUri ? (
        <Image src={imageUri} alt={`${name}'s Avatar`} preview={false} />
      ) : (
        <CharacterAvatarFallback id={id} name={name} size={size} />
      )}
    </div>
  )
}

export default CharacterAvatar
