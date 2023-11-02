import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { getAspectRatio } from '@/lib/media'
import { Creation } from '@edenlabs/eden-sdk'
import { Button } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const CreationPresetInfo = ({ creation }: { creation: Creation }) => {
  const router = useRouter()

  const handleRemoveClick = async () => {
    await router.push('/create/creations')
  }

  return (
    <div className="px-4 py-2 text-gray-500 dark:bg-gray-950">
      <div className="flex items-center overflow-hidden">
        <div
          className="rounded-md w-12 h-12 mr-4 flex items-center overflow-hidden"
          style={{ minWidth: '64px', minHeight: '64px' }}
        >
          {creation.thumbnail ? (
            <ImageResult
              previewSizeUrl={creation.thumbnail}
              aspectRatio={getAspectRatio(
                creation.mediaAttributes.width,
                creation.mediaAttributes.height,
              )}
            />
          ) : (
            <div className="image-placeholder w-full h-full" />
          )}
        </div>
        <div className="min-w-0 w-full flex gap-2 items-center justify-between flex-wrap">
          <div className="flex gap-1 items-center lg:w-full">
            <Link href={`/creations/${creation._id}`}>
              <strong>/{creation.task.generator.generatorName}</strong>
            </Link>
            <div className="flex items-center">
              <span className="mr-2">by</span>{' '}
              <CreatorProfileLink
                creatorId={creation.user.userId}
                creatorName={creation.user.username}
                creatorImage={creation.user.userImage}
              />
            </div>
          </div>
          <Button size={'small'} onClick={() => handleRemoveClick()}>
            Remove preset
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreationPresetInfo
