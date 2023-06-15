import CreationDetail from '@/components/CreationDetail'
import { Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { Modal } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

const CreationCardOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white"></div>
  )
}

const CreationDetailModal = ({
  open,
  setDetailModalOpen,
  creation,
  preUrl,
}: {
  open: boolean
  setDetailModalOpen: (open: boolean) => void
  creation: Creation
  preUrl: string
}) => {
  const router = useRouter()
  const onDetailModalClose = () => {
    setDetailModalOpen(false)
    router.push('', preUrl)
  }

  return (
    <Modal open={open} onCancel={onDetailModalClose} title={creation.name}>
      <CreationDetail creation={creation} />
    </Modal>
  )
}

const CreationCard = ({
  index,
  data,
  width,
}: {
  index: number
  data: Creation
  width: number
}) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [preUrl, setPreUrl] = React.useState(router.asPath)
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)

  const openDetailModal = () => {
    setDetailModalOpen(true)
    setPreUrl(router.asPath)
    router.push('', `/creations/${data._id}`)
  }

  return (
    <>
      <div
        className="relative cursor-pointer"
        onClick={openDetailModal}
        key={index}
      >
        <div className="rounded-lg" ref={ref}>
          <div style={{ position: 'relative' }}>
            <img
              src={data.thumbnail || ''}
              alt=""
              className="w-full border border-gray-200 rounded-lg"
            />
            {hovered && <CreationCardOverlay />}
          </div>
        </div>
      </div>
      <CreationDetailModal
        {...{ open: detailModalOpen, preUrl, setDetailModalOpen }}
        creation={data}
      />
      {false && <p>{width}</p>}
    </>
  )
}

export default CreationCard
