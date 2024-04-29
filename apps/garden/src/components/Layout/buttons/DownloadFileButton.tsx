import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { downloadFile } from '@/lib/files'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import DownloadOutlined from '@ant-design/icons/DownloadOutlined'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { WorkspacePremium } from '@mui/icons-material'
import { App, Popover } from 'antd'
import Link from 'next/link'
import React, { ReactElement } from 'react'

const ButtonElement = ({
  label,
  handleClick,
  isAllowed,
  children,
}: {
  label: string
  handleClick: () => void
  isAllowed: boolean
  children?: ReactElement
}) => {
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 w-full ${
        !isAllowed ? 'text-gray-500' : ''
      }`}
      title={'Download file'}
    >
      {children ? children : null}
      <div>{label}</div>
      <DownloadOutlined className="text-xl ml-auto" />
    </div>
  )
}

const DownloadFileButton = ({
  itemType,
  url,
  fileName,
  label,
}: {
  itemType: ItemType
  url: string
  fileName: string
  label?: string
}) => {
  const { message } = App.useApp()
  const { isAllowed } = useSubscriptionGate(
    itemType === 'concept'
      ? GatedActions.ConceptDownload
      : GatedActions.CreationDownload,
  )
  const { showModal } = useModalContext()
  const handleClick = async (url: string) => {
    if (!isAllowed) {
      showModal(MODAL_TYPES.SUBSCRIPTION_GATE_MODAL, {
        usesUrl: false,
        minimumSubscriptionTier: SubscriptionTier.Pro,
        featureName: 'Model Download',
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
              <strong>Model Download</strong> is a premium feature
            </div>
            <Link href={'/account'} className="font-bold mb-2">
              Explore plans
            </Link>
          </div>
        }
        trigger={['hover']}
      >
        <div className="w-full">
          <ButtonElement
            label={label || ''}
            handleClick={() => handleClick(url)}
            isAllowed={isAllowed}
          >
            <WorkspacePremium fontSize="small" className="text-orange-300" />
          </ButtonElement>
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
