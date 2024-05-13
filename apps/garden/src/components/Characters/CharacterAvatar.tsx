import CharacterAvatarFallback from '@/components/Characters/CharacterAvatarFallback'
import React, { useState } from 'react'
import CdnImage from '@/components/Media/cdn-image'

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
  const [imgError, setImgError] = useState(false)
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
      {imageUri && !imgError ? (
        <CdnImage
          priority={true}
          key={id}
          src={imageUri}
          alt={`${name}'s Avatar`}
          width={90}
          height={90}
          sizes={'90px'}
          style={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <CharacterAvatarFallback id={id} name={name} size={size} />
      )}
    </div>
  )
}

export default CharacterAvatar
