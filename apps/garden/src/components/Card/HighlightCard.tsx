import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { Concept } from '@edenlabs/eden-sdk'
import { Button } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const HighlightCard = ({
  concept,
  coverImageUri,
}: {
  concept: Concept
  coverImageUri: string
}) => {
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 md:h-64 rounded-lg overflow-hidden">
      <div className="relative overflow-hidden h-48 md:h-auto">
        <Image
          src={coverImageUri}
          alt={concept?.name}
          fill={true}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-between p-4 bg-gray-100 dark:bg-gray-900 h-64 md:h-auto">
        <div className="mb-2">
          <h3>{concept.name}</h3>
          <CreatorProfileLink
            creatorName={concept.user.username}
            creatorId={concept.user.userId}
            creatorImage={concept.user.userImage}
          />
        </div>
        <div className="line-clamp-3 mb-4">{concept.description}</div>
        <div className="flex gap-4 justify-between">
          <Button variant="contained" color="success">
            Use Model
          </Button>
          <Link href={`/concepts/${concept._id}`}>
            <Button variant="outlined">See Details</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HighlightCard
