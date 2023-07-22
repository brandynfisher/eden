import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { Creation } from '@edenlabs/eden-sdk'
import { Button, Card } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const CreationPresetInfo = ({ creation }: { creation: Creation }) => {
  const router = useRouter()

  const handleRemoveClick = async () => {
    await router.push('/create')
  }

  return (
    <Card className="text-gray-500 ">
      <div className="flex items-center mb-2 overflow-hidden">
        <div
          className="rounded-md w-12 h-12 mr-4 flex items-center overflow-hidden"
          style={{ minWidth: '64px', minHeight: '64px' }}
        >
          {creation.thumbnail ? (
            <ImageResult resultUrl={creation.thumbnail} />
          ) : (
            <div className="image-placeholder w-full h-full h-full" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate">
            Creation:{' '}
            <Link href={`/creations/${creation._id}`}>{creation._id}</Link>
          </div>
          <div>Generator: {creation.task.generator.generatorName}</div>
          <div className="flex items-center">
            <span className="mr-2">By</span>{' '}
            <CreatorProfileLink
              creatorId={creation.user.userId}
              creatorName={creation.user.username}
            />
          </div>
        </div>
      </div>

      <Button onClick={() => handleRemoveClick()}>Remove preset</Button>
    </Card>
  )
}

export default CreationPresetInfo
