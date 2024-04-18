import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { Concept } from '@edenlabs/eden-sdk'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import ZoomIn from '@mui/icons-material/ZoomIn'
import { Button } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const HighlightCard = ({
  concept,
  customDescription,
  coverImageUri,
  onCoverImageClick,
  priority,
}: {
  concept: Concept
  customDescription?: string
  coverImageUri: string
  onCoverImageClick: () => void
  priority: boolean
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 md:h-80 rounded-lg overflow-hidden">
      <div
        className="relative md:col-span-7 overflow-hidden h-48 sm:h-52 md:h-auto rounded-md sm:rounded-none cursor-zoom-in group"
        onClick={() => onCoverImageClick && onCoverImageClick()}
      >
        <Image
          src={coverImageUri}
          alt={concept?.name}
          fill={true}
          className="object-cover"
          priority={priority}
          loading={!priority ? 'lazy' : 'eager'}
        />
        <div className="absolute flex items-center text-white bottom-2 left-2 bg-gray-600 bg-opacity-70 p-1 rounded-full opacity-50 group-hover:opacity-100">
          <ZoomIn className="h-6" />
        </div>
      </div>
      <div className="flex flex-col md:col-span-5 md:justify-between p-4 bg-gray-200 dark:bg-gray-900 h-60 md:h-auto mx-4 sm:mx-0 sm:px-8 md:px-4 relative top-[-8px] sm:top-auto rounded-lg drop-shadow sm:drop-shadow-none sm:rounded-none">
        <div className="mb-2">
          <h3>{concept.name}</h3>
          <CreatorProfileLink
            creatorName={concept.user.username}
            creatorId={concept.user.userId}
            creatorImage={concept.user.userImage}
          />
        </div>
        <div className="line-clamp-3 md:line-clamp-6 mb-4">
          {customDescription ? customDescription : concept.description}
        </div>
        <div className="flex gap-2 lg:gap-4 justify-between mt-auto">
          <Link href={`/create/creations?concept=${concept._id}`}>
            <Button variant="outlined" className="!flex !items-center h-9">
              <div>Use Model</div>
              <PlayArrowRounded fontSize="small" className="hidden md:block" />
            </Button>
          </Link>
          <Link href={`/concepts/${concept._id}`}>
            <Button
              variant="outlined"
              color="secondary"
              className="!flex !items-center h-9"
            >
              Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HighlightCard
