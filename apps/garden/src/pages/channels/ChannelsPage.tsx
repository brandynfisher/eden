import ChannelCard from '@/components/Channels/ChannelCard'
import {
  OrderByLatest,
  OrderByPopularity,
  OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import React from 'react'

const generatorChannels =
  process.env.NODE_ENV === 'development'
    ? [
        {
          name: 'Stories',
          generatorId: '6511d29ad2d97662167a76d6',
        },
        {
          name: 'img2vid',
          generatorId: '658c7d7778e037285140b71d',
        },
      ]
    : [
        {
          name: 'Stories',
          generatorId: '6511d29ad2d97662167a76d6',
        },
        {
          name: 'Audio-reactive Real2Real',
          generatorId: '659f619a2fbb333c2b29872e',
        },
      ]

const ChannelsPage = () => {
  return (
    <div>
      <div className="mb-2">Channels</div>
      <div className="grid xs:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 flex-wrap gap-4 mb-4">
        <ChannelCard itemType="creation" orderBy={OrderByLatest} />
        <ChannelCard itemType="creation" orderBy={OrderByPopularity} />
        <ChannelCard itemType="creation" orderBy={OrderByScore} />
      </div>
      <div className="grid xs:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 flex-wrap gap-4 mb-4">
        {generatorChannels.map(generatorChannel => (
          <ChannelCard
            key={generatorChannel.generatorId}
            title={generatorChannel.name}
            itemType="creation"
            orderBy={OrderByLatest}
            query={{ generatorId: generatorChannel.generatorId }}
          />
        ))}
      </div>
    </div>
  )
}

export default ChannelsPage
