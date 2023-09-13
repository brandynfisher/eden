import CharacterAvatarFallback from '@/components/Characters/CharacterAvatarFallback'
import { Image } from 'antd'
import React, { useEffect, useState } from 'react'

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
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    setShowFallback(!imageUri)
  }, [imageUri])

  return (
    <div
      className={`overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-900 h-full ${
        size === 'small' ? (imageUri ? 'w-full' : 'w-full') : ''
      } ${size === 'medium' ? 'w-10 h-10' : ''} ${
        size === 'large' ? 'w-14 h-14' : ''
      } ${size === 'auto' ? 'w-full' : ''} ${
        shape === 'square' ? 'rounded ' : 'rounded-full'
      }`}
    >
      {(name || imageUri) && (
        <>
          {!showFallback ? (
            <Image
              key={id}
              src={imageUri}
              alt={`${name}'s Avatar`}
              preview={false}
              className="object-contain"
            />
          ) : (
            <CharacterAvatarFallback id={id} name={name} size={size} />
          )}
        </>
      )}
    </div>
  )
}

export default CharacterAvatar
