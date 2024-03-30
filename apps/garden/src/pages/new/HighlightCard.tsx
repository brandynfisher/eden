import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { Concept } from '@edenlabs/eden-sdk'
import { Button } from '@mui/material'
import Image from 'next/image'
import React from 'react'

const HighlightCard = ({
  concept,
  coverImageUri,
}: {
  concept: Concept
  coverImageUri: string
}) => {
  return (
    <div className="mb-2 snap-center">
      <div className="relative grid grid-cols-2 h-64 rounded-lg overflow-hidden">
        <div className="relative overflow-hidden">
          <Image
            src={coverImageUri}
            alt={concept.name}
            fill={true}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-between p-4 bg-gray-100 dark:bg-gray-900">
          <div>
            <h3>{concept.name}</h3>
            <div>{concept.description ? concept.description : 'n/a'}</div>
            <CreatorProfileLink
              creatorName={concept.user.username}
              creatorId={concept.user.userId}
              creatorImage={concept.user.userImage}
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outlined">Action 1</Button>
            <Button variant="outlined">Action 2</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HighlightCard
