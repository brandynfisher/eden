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
          generatorIds: [
            '6511d29ad2d97662167a76d6', // dialogue
            '65047b5a5c9278a72cd0ae91', // monologue
            '65a484364f1d544e3a1d9434', // story
          ],
        },
        {
          name: 'anything2vid',
          generatorIds: [
            '658c7d7778e037285140b71d',
            '658c7d3878e037285140b71c',
            '658c7d8a78e037285140b71e',
          ],
        },
        {
          name: 'real2real',
          generatorIds: ['63f0987f1bbd8127b36a8a35'],
        },
      ]
    : [
        {
          name: 'Stories',
          generatorIds: [
            '6511d29ad2d97662167a76d6', // dialogue
            '65047b5a5c9278a72cd0ae91', // monologue
            '65a484ac4f1d544e3a1d9435', // story
          ],
        },
        {
          name: 'anything2vid',
          generatorIds: [
            '659f615f2fbb333c2b29872b',
            '659f612c2fbb333c2b29872a',
            '659f61772fbb333c2b29872c',
          ],
        },
        {
          name: 'real2real',
          generatorIds: ['63f0987f1bbd8127b36a8a35'],
        },
        {
          name: 'real2real_audio',
          generatorIds: ['659f619a2fbb333c2b29872e'],
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
            key={generatorChannel.name}
            title={generatorChannel.name}
            itemType="creation"
            orderBy={OrderByLatest}
            query={{ generatorId: generatorChannel.generatorIds }}
          />
        ))}
      </div>
    </div>
  )
}

export default ChannelsPage
