import AddToCollectionModal from '@/components/Collections/AddToCollectionModal'
import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import MediaPreview from '@/components/Creation/CreationInterface/media/MediaPreview'
import CreationReactions from '@/components/Creation/CreationReactions'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { getModalUrls } from '@/lib/modal'
import { timeAgo } from '@/lib/time'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { EllipsisOutlined } from '@ant-design/icons'
import { Creation } from '@edenlabs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { Dropdown } from 'antd'
import { useRouter } from 'next/router'
import React, { FC, useEffect, useState } from 'react'

const CreationCard: FC<{ index: number; data: Creation }> = ({
  index,
  data,
}) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [creation, setCreation] = useState(data)
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] =
    useState(false)

  const { pageUrl, modalUrl } = getModalUrls(router, 'creation', creation._id)
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CREATION_DETAIL_MODAL, {
      creation,
      loadSimilar: true,
      usesUrl: true,
    })
  }

  const [createdDateString, setCreatedDateString] = useState('')
  const timeSinceCreation = timeAgo(creation.createdAt)

  useEffect(() => {
    setCreatedDateString(new Date(creation.createdAt).toLocaleString())
  }, [creation])

  const getCardMenuItems = () => {
    return [
      {
        label: (
          <div
            onClick={() =>
              console.log('//@todo: copy creation url to clipboard')
            }
          >
            Copy... creation url to clipboard
          </div>
        ),
        key: '1',
      },
      {
        label: (
          <div
            onClick={() => console.log('//@todo: copy image file to clipboard')}
          >
            Copy... image file to clipboard
          </div>
        ),
        key: '2',
      },
      {
        label: (
          <div
            onClick={() => console.log('//@todo: copy image url to clipboard')}
          >
            Copy... image url to clipboard
          </div>
        ),
        key: '3',
      },
    ]
  }

  return (
    <div ref={ref} className="mx-auto max-w-[500px] md:mx-0 md:max-w-none">
      <div className="relative" key={index}>
        <div className="w-full flex justify-center flex-col">
          <div
            className={` flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-900 md:bg-opacity-70 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none ${
              hovered ? 'md:!visible' : 'md:hidden'
            }`}
          >
            <div className="flex items-center pointer-events-auto">
              <CreatorProfileLink
                creatorId={creation.user.userId}
                creatorName={creation.user.username}
                creatorImage={creation.user.userImage}
              />
              <div className="text-gray-400 text-xs" title={createdDateString}>
                <span className="mx-1">•</span>
                {timeSinceCreation}
              </div>
            </div>
            <Dropdown
              trigger={['click']}
              arrow={true}
              placement="bottomRight"
              menu={{ items: getCardMenuItems() }}
            >
              <div className="flex items-center cursor-pointer pointer-events-auto">
                <EllipsisOutlined className="text-xl hover:scale-125 active:scale-125 hover:text-blue-500 transition-all active:text-blue-500 active:brightness-125" />
              </div>
            </Dropdown>
          </div>
          <div
            className="card-image relative rounded-lg overflow-hidden cursor-pointer"
            onClick={openDetailModal}
          >
            <a
              onClick={ev => ev.preventDefault()}
              href={`/creations/${creation._id}`}
              target={'_blank'}
            >
              <MediaPreview creation={creation} hovered={hovered} />
            </a>
          </div>
          <div
            className={`md:mt-1 md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-900 md:bg-opacity-70 md:rounded-b-lg md:pb-2 md:px-2 pointer-events-none ${
              hovered ? 'md:!visible' : 'md:hidden'
            }`}
          >
            <CreationReactions creation={creation} onChange={setCreation} />
            <CreationCardDetail creation={creation} />
          </div>
        </div>
      </div>
      <AddToCollectionModal
        open={addToCollectionModalOpen}
        setOpen={setAddToCollectionModalOpen}
        creation={creation}
      />
    </div>
  )
}

export default CreationCard
