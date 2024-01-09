import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { handleAxiosError } from '@/lib/fetcher'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { WorkspacePremium } from '@mui/icons-material'
import LockPersonIcon from '@mui/icons-material/LockPerson'
import { App, Popover } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import React, { ReactElement } from 'react'

const ButtonElement = ({
  label,
  itemType,
  handleClick,
  isAllowed,
  children,
}: {
  label: string
  itemType: ItemType
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
      title={`Make ${itemType} private`}
    >
      {children ? children : null}
      <div>{label}</div>
      <LockPersonIcon fontSize="small" className="ml-auto" />
    </div>
  )
}

const MakePrivateButton = ({
  itemId,
  itemType,
  label,
  onChange,
}: {
  itemId: string
  itemType: ItemType
  label?: string
  onChange?: (visibilityUpdate: { isPrivate: boolean }) => void
}) => {
  const { message } = App.useApp()
  const { isAllowed } = useSubscriptionGate(GatedActions.MakePrivate)
  const { showModal } = useModalContext()

  const handleClick = async () => {
    if (!isAllowed) {
      showModal(MODAL_TYPES.SUBSCRIPTION_GATE_MODAL, {
        usesUrl: false,
        minimumSubscriptionTier: SubscriptionTier.Basic,
        featureName: 'Private Creations',
      })
      return
    }

    try {
      await axios.patch(`/api/${itemType}s/${itemId}`, {
        update: { isPrivate: true },
      })
      message.destroy()
      message.success(`${itemType} set to private`)
      onChange && onChange({ isPrivate: true })
    } catch (err) {
      handleAxiosError(err, message)
    }
  }

  if (!isAllowed) {
    return (
      <Popover
        arrow={true}
        overlayClassName="popover-subscription-gate"
        content={
          <div className="text-center">
            <div className="mb-1">
              <strong>Private Creations</strong> is a premium feature
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
            itemType={itemType}
            isAllowed={isAllowed}
            handleClick={() => handleClick()}
          >
            <WorkspacePremium fontSize="small" className="text-orange-300 " />
          </ButtonElement>
        </div>
      </Popover>
    )
  }

  return (
    <ButtonElement
      label={label || ''}
      itemType={itemType}
      handleClick={() => handleClick()}
      isAllowed={isAllowed}
    />
  )
}

export default MakePrivateButton
