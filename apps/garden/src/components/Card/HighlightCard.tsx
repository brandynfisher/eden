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
    <div className="relative grid grid-cols-1 md:grid-cols-2 md:h-80 rounded-lg overflow-hidden">
      <div className="relative overflow-hidden h-48 sm:h-52 md:h-auto rounded-md sm:rounded-none">
        <Image
          src={coverImageUri}
          alt={concept?.name}
          fill={true}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col md:justify-between p-4 bg-gray-100 dark:bg-gray-900 h-60 md:h-auto mx-4 sm:mx-0 sm:px-8 md:px-4 relative top-[-24px] sm:top-auto rounded-lg drop-shadow sm:drop-shadow-none sm:rounded-none">
        <div className="mb-2">
          <h3>{concept.name}</h3>
          <CreatorProfileLink
            creatorName={concept.user.username}
            creatorId={concept.user.userId}
            creatorImage={concept.user.userImage}
          />
        </div>
        <div className="line-clamp-4 md:line-clamp-6 mb-4">
          {concept.description}
        </div>
        <div className="flex gap-4 justify-between mt-auto">
          <Link href={`/create/creations?concept=${concept._id}`}>
            <Button variant="contained" color="success" size="small">
              Use Model
            </Button>
          </Link>
          <Link href={`/concepts/${concept._id}`}>
            <Button variant="outlined" size="small">
              See Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HighlightCard
