import AddToCollectionModal from '@/components/Collections/AddToCollectionModal'
import CopyImageButton from '@/components/CopyImageButton'
import CopyUrlButton from '@/components/CopyUrlButton'
import CreationCardDetail from '@/components/Creation/CreationCard/CreationCardDetail'
import MediaPreview from '@/components/Creation/CreationInterface/media/MediaPreview'
import CreationReactions from '@/components/Creation/CreationReactions'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { CONFIG } from '@/lib/config'
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
        label: 'Copy...',
        key: '1',
        children: [
          {
            icon: <CopyImageButton url={creation.uri} variant="text" />,
            key: '1-1',
          },
          {
            icon: (
              <CopyUrlButton
                url={creation.uri}
                variant="text"
                label="Image URL"
              />
            ),
            key: '1-2',
          },
          {
            icon: (
              <CopyUrlButton
                url={`${CONFIG.NEXT_PUBLIC_HOST}${pageUrl || modalUrl}`}
                variant="text"
                label="Page URL"
              />
            ),
            key: '1-3',
          },
        ],
      },
    ]
  }

  return (
    <div ref={ref} className="mx-auto max-w-[500px] md:mx-0 md:max-w-none">
      <div className="relative" key={index}>
        <div className="w-full flex justify-center flex-col">
          <div
            className={` flex items-center justify-between mb-[12px] md:absolute md:z-10 md:w-full md:top-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-t-lg md:py-1 md:px-2 pointer-events-none ${
              hovered ? 'md:!visible' : 'md:hidden'
            }`}
          >
            <div className="flex items-center pointer-events-auto">
              <CreatorProfileLink
                creatorId={creation.user.userId}
                creatorName={creation.user.username}
                creatorImage={creation.user.userImage}
              />
              <div
                className="text-gray-700 dark:text-gray-400 text-xs"
                title={createdDateString}
              >
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
            className={`mt-1 md:absolute md:z-10 md:w-full md:bottom-0 md:bg-gray-200 md:dark:bg-gray-900 md:!bg-opacity-80 md:rounded-b-lg md:pb-2 md:px-2 pointer-events-none ${
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
