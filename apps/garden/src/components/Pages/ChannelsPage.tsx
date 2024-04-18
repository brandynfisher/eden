import ChannelCard from '@/components/Channels/ChannelCard'
import {
  OrderByLatest,
  OrderByPopularity,
  OrderByScore,
} from '@/components/Layout/buttons/OrderByButtons'
import { ChannelSettings } from '@/components/Modals/ChannelDetailsModal'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { InputNumber, Switch } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

export const storyGeneratorIds =
  process.env.NODE_ENV === 'development'
    ? [
        '6511d29ad2d97662167a76d6', // dialogue
        '65047b5a5c9278a72cd0ae91', // monologue
        '65a484364f1d544e3a1d9434', // story
        '65da6b9743b45bf35d221515', // reel
      ]
    : [
        '6511d29ad2d97662167a76d6', // dialogue
        '65047b5a5c9278a72cd0ae91', // monologue
        '65a484ac4f1d544e3a1d9435', // story
        '65da8e5643b45bf35d221518', // reel
      ]
export const anything2vidGeneratorIds =
  process.env.NODE_ENV === 'development'
    ? [
        '658c7d7778e037285140b71d',
        '658c7d3878e037285140b71c',
        '658c7d8a78e037285140b71e',
      ]
    : [
        '659f615f2fbb333c2b29872b',
        '659f612c2fbb333c2b29872a',
        '659f61772fbb333c2b29872c',
      ]

const generatorChannels = [
  {
    name: 'Stories',
    generatorIds: storyGeneratorIds,
  },
  {
    name: 'anything2vid',
    generatorIds: anything2vidGeneratorIds,
  },
  ...(process.env.NODE_ENV === 'development'
    ? [
        {
          name: 'real2real',
          generatorIds: ['63f0987f1bbd8127b36a8a35'],
        },
      ]
    : [
        {
          name: 'real2real',
          generatorIds: ['63f0987f1bbd8127b36a8a35'],
        },
        {
          name: 'real2real_audio',
          generatorIds: ['659f619a2fbb333c2b29872e'],
        },
      ]),
]

const ChannelsPage = () => {
  const router = useRouter()
  const [showPrompt, setShowPrompt] = useState<boolean>(true)
  const [showQrCode, setShowQrCode] = useState<boolean>(true)
  const [showCreator, setShowCreator] = useState<boolean>(true)
  const [muteVideoAudio, setMuteVideoAudio] = useState<boolean>(false)
  const [imageDisplayDuration, setImageDisplayDuration] = useState<number>(10)
  const [insertNewCreations, setInsertNewCreations] = useState<boolean>(true)
  const [settings, setSettings] = useState<ChannelSettings>({
    showPrompt,
    showQrCode,
    showCreator,
    imageDisplayDuration,
    muteVideoAudio,
    insertNewCreations,
  })
  const { showModal } = useModalContext()
  const [modalOpen, setModalOpen] = useState<number | string>()

  useEffect(() => {
    setSettings({
      showPrompt,
      showQrCode,
      showCreator,
      imageDisplayDuration,
      muteVideoAudio,
      insertNewCreations,
    })
  }, [
    muteVideoAudio,
    showPrompt,
    showQrCode,
    showCreator,
    imageDisplayDuration,
    insertNewCreations,
  ])

  useEffect(() => {
    console.log(
      router.query,
      Object.keys(router.query).length,
      Object.keys(router.query).length > 0,
    )
    if (!modalOpen && Object.keys(router.query).length > 0) {
      const id = showModal(MODAL_TYPES.CHANNEL_DETAIL_MODAL, {
        usesUrl: false,
        title: 'Custom',
        itemType: 'creation',
        orderBy: OrderByLatest,
        query: { ...router.query, maxDate: new Date().toISOString() },
        settings,
      })
      setModalOpen(id)
    }
  }, [modalOpen, showModal, settings, router.query])

  return (
    <div>
      <h3 className="mb-4">Channels</h3>
      <div className="mb-4">
        <div className="mb-2">Settings</div>
        <div className="p-2 py-4 bg-gray-300 dark:bg-gray-800 rounded-md">
          <div className="mb-4 flex gap-2 flex-wrap">
            Display
            <div>
              <Switch
                defaultChecked={showPrompt}
                onChange={() => setShowPrompt(!showPrompt)}
                checkedChildren={<div>Prompt</div>}
                unCheckedChildren={<div>Prompt</div>}
              />
            </div>
            <div>
              <Switch
                defaultChecked={showCreator}
                onChange={() => setShowCreator(!showCreator)}
                checkedChildren={<div>Creator</div>}
                unCheckedChildren={<div>Creator</div>}
              />
            </div>
            <div>
              <Switch
                defaultChecked={showQrCode}
                onChange={() => setShowQrCode(!showQrCode)}
                checkedChildren={<div>QR-Code</div>}
                unCheckedChildren={<div>QR-Code</div>}
              />
            </div>
          </div>
          <div className="mb-4 flex gap-2 flex-wrap">
            Video
            <div>
              <Switch
                defaultChecked={muteVideoAudio}
                onChange={() => setMuteVideoAudio(!muteVideoAudio)}
                checkedChildren={<div>Mute Audio</div>}
                unCheckedChildren={<div>Mute Audio</div>}
              />
            </div>
          </div>
          <div className="mb-4 flex gap-2 flex-wrap">
            Misc
            <div>
              <Switch
                defaultChecked={insertNewCreations}
                onChange={() => setInsertNewCreations(!insertNewCreations)}
                checkedChildren={<div>Fetch newer creations</div>}
                unCheckedChildren={<div>Fetch newer creations</div>}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="duration">Image duration</label>
              <InputNumber
                id="duration"
                name="duration"
                className="w-20"
                defaultValue={imageDisplayDuration}
                min={1}
                max={60 * 60}
                onChange={newVal => setImageDisplayDuration(newVal || 10)}
                step={1}
              />
              <div className="text-gray-400">seconds</div>
            </div>
            <div className="italic text-xs text-gray-500 mt-2">
              Sets image display duration (videos will use their own duration)
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2">List</div>
      <div className="grid xs:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 flex-wrap gap-4 mb-4">
        <ChannelCard
          itemType="creation"
          orderBy={OrderByLatest}
          settings={settings}
        />
        <ChannelCard
          itemType="creation"
          orderBy={OrderByPopularity}
          settings={settings}
        />
        <ChannelCard
          itemType="creation"
          orderBy={OrderByScore}
          settings={settings}
        />
      </div>
      <div className="grid xs:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 flex-wrap gap-4 mb-4">
        {generatorChannels.map(generatorChannel => (
          <ChannelCard
            key={generatorChannel.name}
            title={generatorChannel.name}
            itemType="creation"
            orderBy={OrderByLatest}
            query={{ generatorId: generatorChannel.generatorIds }}
            settings={settings}
          />
        ))}
      </div>
    </div>
  )
}

export default ChannelsPage
