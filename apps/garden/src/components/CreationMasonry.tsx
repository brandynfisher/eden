import CreationCard from '@/components/CreationCard/CreationCard'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@eden-labs/eden-sdk'
import { Masonry } from 'masonic'
import React, { useContext } from 'react'

const CreationMasonry = ({ creations }: { creations: Creation[] }) => {
  const { settings } = useContext(UserContext)

  return (
    <div className="w-full">
      <Masonry
        items={creations}
        columnCount={settings?.maxGridCols.value || undefined}
        maxColumnCount={settings?.maxGridCols.value || 4}
        columnGutter={12}
        overscanBy={2}
        render={CreationCard}
        itemHeightEstimate={500}
      />
    </div>
  )
}

export default CreationMasonry
