import CreationDetail from '@/components/Creation/CreationDetail/CreationDetail'
import { CloseOutlined } from '@ant-design/icons'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const CreationDetailModal = ({
  onAfterClose,
  creation,
  modalUrl,
}: {
  onAfterClose: () => void
  creation: Creation
  modalUrl: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (router.asPath === modalUrl) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [modalUrl, router.asPath])

  const CloseButton = () => {
    return (
      <div className="text-white text-xl">
        <CloseOutlined />
      </div>
    )
  }

  const onCloseHandler = () => {
    setIsOpen(false)
    router.back()
  }

  const afterCloseHandler = () => {
    onAfterClose()
  }

  return (
    <Modal
      open={isOpen}
      closeIcon={<CloseButton />}
      onCancel={onCloseHandler}
      afterClose={afterCloseHandler}
      footer={false}
      width={''} // unsets default width, so we can handle it with util classes
      className="flex overflow-hidden flex-col mx-auto relative z-20 w-full lg:max-w-6xl h-auto my-4 lg:items-center lg:justify-center my-4 lg:my-12 lg:mt-4 shadow-2xl"
    >
      <CreationDetail creation={creation} />
    </Modal>
  )
}

export default CreationDetailModal
