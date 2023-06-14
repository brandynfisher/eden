import CreationCard from '@/components/CreationCard/CreationCard'
import { chunkArray } from '@/lib/chunk'
import { Creation } from '@eden-labs/eden-sdk'
import React, { PropsWithChildren } from 'react'

const CreationMasonryRow = ({ children }: PropsWithChildren) => {
  return <div className="grid gap-4">{children}</div>
}

const CreationMasonry = ({ creations }: { creations: Creation[] }) => {
  const creationsChunked = chunkArray(creations, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {creationsChunked.map((creationRow, index) => (
        <CreationMasonryRow key={index}>
          {creationRow.map((creation, i) => (
            <CreationCard key={i} creation={creation} />
          ))}
        </CreationMasonryRow>
      ))}
    </div>
  )
}

export default CreationMasonry
