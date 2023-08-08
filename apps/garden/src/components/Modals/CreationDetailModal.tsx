import CreationDetail from '@/components/Creation/CreationDetail/CreationDetail'
import { Creation } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'

const CreationDetailModal = ({ creation, ...rest }: { creation: Creation }) => {
  return (
    <Modal {...rest}>
      <CreationDetail creation={creation} isModal={true} />
    </Modal>
  )
}

export default CreationDetailModal
