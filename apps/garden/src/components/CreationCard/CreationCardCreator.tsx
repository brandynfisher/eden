import CreatorProfileLink from '@/components/CreatorProfileLink'
// import { useHover } from '@mantine/hooks'
import React from 'react'

const CreationCardCreator = ({ creatorId }: { creatorId: string }) => {
  // const { hovered, ref } = useHover()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      // ref={ref}
      className="flex items-center relative p-1"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gray-800 opacity-50 rounded-md" />
      <div className="z-10">
        {' '}
        <CreatorProfileLink creatorId={creatorId} />
      </div>
    </div>
  )
}

export default CreationCardCreator
