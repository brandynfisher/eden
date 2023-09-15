import CharacterAvatarFallback from '@/components/Characters/CharacterAvatarFallback'
import Image from 'next/image'
import React from 'react'

const CharacterAvatar = ({
  id,
  name,
  imageUri,
  size,
  shape = 'square',
}: {
  id: string
  name: string
  imageUri?: string
  size?: 'small' | 'medium' | 'large' | 'auto' | undefined
  shape?: 'square' | 'circle'
}) => {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-900 h-full ${
        size === 'small' ? (imageUri ? 'w-full' : 'w-full') : ''
      } ${size === 'medium' ? 'w-10 h-10' : ''} ${
        size === 'large' ? 'w-14 h-14' : ''
      } ${size === 'auto' ? 'w-full' : ''} ${
        shape === 'square' ? 'rounded ' : 'rounded-full'
      }`}
    >
      {imageUri ? (
        <Image
          key={id}
          src={imageUri}
          alt={`${name}'s Avatar`}
          width={90}
          height={90}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      ) : (
        <CharacterAvatarFallback id={id} name={name} size={size} />
      )}
    </div>
  )
}

export default CharacterAvatar
