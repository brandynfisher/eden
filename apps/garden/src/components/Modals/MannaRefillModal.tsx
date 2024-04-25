'use client'

import MannaVoucherRedeem from '@/components/MannaVoucherRedeem'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import { Modal } from 'antd'
import React from 'react'

const MannaRefillModal = ({ ...rest }: {}) => {
  return (
    <Modal
      {...rest}
      className="modal-small max-w-md flex flex-col w-full items-center justify-center"
    >
      <div className="flex justify-between items-center bg-gray-300 dark:bg-gray-900 rounded-t-lg h-11 px-4 flex-wrap overflow-hidden">
        <div className="font-bold flex-shrink-0">Redeem Manna Voucher</div>
        <div className="flex justify-end flex-shrink-0 mr-10 lg:mr-6">
          <a
            href="https://docs.eden.art/docs/overview/manna"
            target="_blank"
            className="flex gap-1 items-center"
            rel="noreferrer"
          >
            Learn about Manna
            <LinkOutlined />
          </a>
        </div>
      </div>
      <div className="p-4">
        <MannaVoucherRedeem />
      </div>
    </Modal>
  )
}

export default MannaRefillModal
