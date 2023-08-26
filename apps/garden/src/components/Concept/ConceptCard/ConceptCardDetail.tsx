import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { timeAgo } from '@/lib/time'
import { Concept } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

const ConceptCardDetail = ({
  concept,
  isOverlay,
}: {
  concept: Concept
  isOverlay?: boolean
}) => {
  const [createdDateString, setCreatedDateString] = useState('')
  const timeSinceConcept = timeAgo(concept.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
  }, [concept])

  return (
    <div className="flex items-center relative p-2">
      <div className="absolute inset-0 bg-gray-800 opacity-80 rounded-t-md" />
      <div className="z-10 w-full">
        <div
          title={concept.conceptName}
          className="relative first-letter:uppercase text-sm font-bold text-white select-text  cursor-text mb-2 w-full text-ellipsis text-gray-300 break-words line-clamp-2"
        >
          {concept.conceptName}
        </div>

        <div className="text-gray-400 text-xs mb-2" title={createdDateString}>
          {timeSinceConcept}
        </div>

        <CreatorProfileLink
          creatorId={concept.user?.userId}
          creatorName={concept.user?.username}
          creatorImage={concept.user?.userImage}
          isOverlay={isOverlay}
        />
      </div>
    </div>
  )
}

export default ConceptCardDetail
