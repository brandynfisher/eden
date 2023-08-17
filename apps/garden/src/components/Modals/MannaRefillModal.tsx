'use client'

import MannaVoucherRedeem from '@/components/MannaVoucherRedeem'
import { Modal } from 'antd'

const MannaRefillModal = ({ ...rest }: {}) => {
  return (
    <Modal {...rest}>
      <MannaVoucherRedeem />
    </Modal>
  )
}

export default MannaRefillModal
