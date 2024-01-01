import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { downloadFile } from '@/lib/files'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import DownloadOutlined from '@ant-design/icons/DownloadOutlined'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { WorkspacePremium } from '@mui/icons-material'
import { App, Popover } from 'antd'
import Link from 'next/link'
import React from 'react'

const ButtonElement = ({
  label,
  handleClick,
  isAllowed,
}: {
  label: string
  handleClick: () => void
  isAllowed: boolean
}) => {
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 w-full justify-between ${
        !isAllowed ? 'text-gray-500' : ''
      }`}
      title={'Download file'}
    >
      <div>{label}</div>
      <DownloadOutlined className="text-xl" />
    </div>
  )
}

const DownloadFileButton = ({
  url,
  fileName,
  label,
}: {
  url: string
  fileName: string
  label?: string
}) => {
  const { message } = App.useApp()
  const { isAllowed } = useSubscriptionGate(GatedActions.ConceptDownload)
  const { showModal } = useModalContext()
  const handleClick = async (url: string) => {
    if (!isAllowed) {
      // console.log('show notice, not allowed, subscribe')
      showModal(MODAL_TYPES.SUBSCRIPTION_GATE_MODAL, {
        usesUrl: false,
        minimumSubscriptionTier: SubscriptionTier.Pro,
        featureName: 'Concept Download',
      })
      return
    }

    message.destroy()
    message.success(`Downloading file...`)
    await downloadFile(url, fileName)
  }

  if (!isAllowed) {
    return (
      <Popover
        arrow={true}
        overlayClassName="popover-subscription-gate"
        content={
          <div className="text-center">
            <div className="mb-1">
              <strong>Concept Download</strong> is a premium feature
            </div>
            <Link href={'/manna'} className="font-bold mb-2">
              Explore plans
            </Link>
          </div>
        }
        trigger={['hover']}
      >
        <div className="w-full flex gap-1">
          <WorkspacePremium className="text-orange-300" />
          <ButtonElement
            label={label || ''}
            handleClick={() => handleClick(url)}
            isAllowed={isAllowed}
          />
        </div>
      </Popover>
    )
  }

  return (
    <ButtonElement
      label={label || ''}
      handleClick={() => handleClick(url)}
      isAllowed={isAllowed}
    />
  )
}

export default DownloadFileButton
