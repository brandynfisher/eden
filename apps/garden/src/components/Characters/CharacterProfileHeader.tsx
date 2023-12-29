import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import CircleButton from '@/components/Layout/buttons/CircleButton'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import ShareButton from '@/components/Layout/buttons/ShareButton'
import { createSession } from '@/lib/chat'
import { CONFIG } from '@/lib/config'
import CommentOutlined from '@ant-design/icons/CommentOutlined'
import { Character } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const CharacterProfileHeader = ({
  character,
  numCreations,
}: {
  character?: Character
  numCreations?: number
}) => {
  const router = useRouter()
  const displayName = character ? character.name : ''
  const displayImage = character ? character.image : ''
  const [hasNativeShare, setHasNativeShare] = useState(false)

  useEffect(() => {
    if (navigator && !!navigator.share) {
      setHasNativeShare(true)
    }
  }, [])

  return (
    <div className="flex flex-col border border-solid border-gray-300 dark:border-gray-900 rounded-lg p-4 relative">
      <div className="flex w-full justify-start gap-4 items-stretch">
        <div className="flex flex-col items-center h-full flex-shrink-0 w-min">
          <div className={`w-[90px] h-[90px] rounded-full overflow-hidden`}>
            <CharacterAvatar
              id={'character'}
              name={displayName || ''}
              imageUri={displayImage || ''}
              size="auto"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center w-full min-w-0 h-full">
          <div className="flex items-center flex-wrap md:flex-nowrap">
            <div
              className={`dark:text-white text-md font-semibold min-w-0`}
              title={displayName}
            >
              <div className="text-lg truncate">{displayName}</div>
            </div>
            <div className="flex gap-1 ml-auto">
              <CopyUrlButton
                url={`${CONFIG.NEXT_PUBLIC_HOST}/characters/${character?._id}`}
              />
              {hasNativeShare && (
                <ShareButton
                  title={'Share Creation'}
                  url={`${CONFIG.NEXT_PUBLIC_HOST}/characters/${character?._id}`}
                />
              )}
              {character && (
                <CircleButton
                  title={'Chat'}
                  icon={<CommentOutlined className="text-xl" />}
                  onClick={() => createSession(character?._id, router)}
                />
              )}
            </div>
          </div>
          <div>
            <div className="text-sm my-1">
              <strong>{numCreations || 0}</strong> Creations
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CharacterProfileHeader
