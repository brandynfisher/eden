import CreationDetail from '@/components/CreationDetail/CreationDetail'
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
  const onDetailModalClose = () => {
    setDetailModalOpen(false)
    router.push('', preUrl)
  }

  return (
    <Modal
      open={open}
      onCancel={onDetailModalClose}
      title={creation.name}
      footer={false}
      width={''} // unsets default width, so we can handle it with util classes
      className="flex overflow-hidden flex-col mx-auto relative z-20 w-full lg:max-w-6xl h-auto my-4 lg:my-12 lg:items-center"
    >
      <CreationDetail creation={creation} />
    </Modal>
  )
}

export default CreationDetailModal
