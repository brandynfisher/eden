import ChannelCard from '@/components/Channels/ChannelCard'
import {
  OrderByLatest,
  OrderByPopularity,
  OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import React from 'react'

const ChannelsPage = () => {
  return (
    <div>
      <div className="mb-2">Channels</div>
      <div className="grid xs:grid-cols-3 xl:grid-cols-3 3xl:grid-cols-4 flex-wrap gap-4">
        <ChannelCard itemType="creation" orderBy={OrderByLatest} />
        <ChannelCard itemType="creation" orderBy={OrderByPopularity} />
        <ChannelCard itemType="creation" orderBy={OrderByScore} />
      </div>
    </div>
  )
}

export default ChannelsPage
