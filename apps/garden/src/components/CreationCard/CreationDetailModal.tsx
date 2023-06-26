import CreationDetail from '@/components/CreationDetail/CreationDetail'
import { CloseOutlined } from '@ant-design/icons'
import { Creation } from '@eden-labs/eden-sdk'
import { Modal } from 'antd'
import { useRouter } from 'next/router'

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
  const onDetailModalClose = async () => {
    setDetailModalOpen(false)
    await router.push('', preUrl)
  }

  const CloseButton = () => {
    return (
      <div className="text-white text-xl">
        <CloseOutlined />
      </div>
    )
  }

  return (
    <Modal
      open={open}
      closeIcon={<CloseButton />}
      onCancel={onDetailModalClose}
      footer={false}
      width={''} // unsets default width, so we can handle it with util classes
      className="flex overflow-hidden flex-col mx-auto relative z-20 w-full lg:max-w-6xl h-auto my-4 lg:items-center my-4 lg:my-12 lg:mt-8 shadow-2xl"
    >
      <CreationDetail creation={creation} />
    </Modal>
  )
}

export default CreationDetailModal
