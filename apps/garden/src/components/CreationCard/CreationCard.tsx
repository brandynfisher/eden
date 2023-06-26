import AddToCollectionModal from '@/components/Collections/AddToCollectionModal'
import CreationCardHoverOverlay from '@/components/CreationCard/CreationCardHoverOverlay'
import CreationCardPreview from '@/components/CreationCard/CreationCardPreview'
import CreationDetailModal from '@/components/CreationCard/CreationDetailModal'
import { Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { message } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

const CreationCard = ({ index, data }: { index: number; data: Creation }) => {
  const router = useRouter()
  const { hovered, ref } = useHover()
  const [preUrl, setPreUrl] = React.useState(router.asPath)
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [creation, setCreation] = React.useState(data)
  const [messageApi, contextHolder] = message.useMessage()
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] =
    React.useState(false)

  const openDetailModal = () => {
    setDetailModalOpen(true)
    setPreUrl(router.asPath)
    router.push('', `/creations/${creation._id}`)
  }

  return (
    <>
      <div className="relative " key={index}>
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative rounded-lg overflow-hidden cursor-pointer "
          >
            <CreationCardPreview creation={creation} hovered={hovered} />
            {hovered && (
              <CreationCardHoverOverlay
                creation={creation}
                handlers={{ onChange: setCreation, openDetailModal }}
              />
            )}
          </div>
        </div>
      </div>
      <CreationDetailModal
        {...{ open: detailModalOpen, preUrl, setDetailModalOpen }}
        creation={creation}
      />
      {contextHolder}
      <AddToCollectionModal
        open={addToCollectionModalOpen}
        setOpen={setAddToCollectionModalOpen}
        creation={creation}
        messageApi={messageApi}
      />
    </>
  )
}

export default CreationCard
