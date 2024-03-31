import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useConcept } from '@/hooks/useConcept'
import { Concept } from '@edenlabs/eden-sdk'
import { Button, Skeleton } from '@mui/material'
import Image from 'next/image'
import React from 'react'

const HighlightCard = ({
  conceptId,
  coverImageUri,
}: {
  conceptId: Concept['_id']
  coverImageUri: string
}) => {
  const { concept, isLoading } = useConcept(conceptId)

  return (
    <div className="relative grid grid-cols-2 h-64 rounded-lg overflow-hidden">
      <div className="relative overflow-hidden">
        {isLoading ? (
          <Skeleton variant="rectangular" className="!w-full !h-full" />
        ) : (
          <Image
            src={coverImageUri}
            alt={concept.name}
            fill={true}
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-col justify-between p-4 bg-gray-100 dark:bg-gray-900">
        <div>
          <h3>{isLoading ? <Skeleton variant="text" /> : concept.name}</h3>
          <div>
            {isLoading ? (
              <Skeleton variant="text" />
            ) : concept.description ? (
              concept.description
            ) : (
              ''
            )}
          </div>
          {isLoading ? (
            <Skeleton variant="text" />
          ) : (
            <CreatorProfileLink
              creatorName={concept.user.username}
              creatorId={concept.user.userId}
              creatorImage={concept.user.userImage}
            />
          )}
        </div>
        <div className="flex gap-4">
          <Button variant="outlined">Action 1</Button>
          <Button variant="outlined">Action 2</Button>
        </div>
      </div>
    </div>
  )
}

export default HighlightCard
