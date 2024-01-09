import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { handleAxiosError } from '@/lib/fetcher'
import {
  ItemType,
  MODAL_TYPES,
  useModalContext,
} from '@/providers/ModalProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { WorkspacePremium } from '@mui/icons-material'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { App, Popover, Tooltip } from 'antd'
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
      title={`Make ${itemType} public`}
    >
      {children ? children : null}
      <div>{label}</div>
      <LockOpenIcon fontSize="small" className="ml-auto" />
    </div>
  )
}

const MakePublicButton = ({
  itemId,
  itemType,
  label,
  onChange,
  isNsfw,
}: {
  itemId: string
  itemType: ItemType
  label?: string
  onChange?: (visibilityUpdate: { isPrivate: boolean }) => void
  isNsfw?: boolean
}) => {
  const { message } = App.useApp()
  const { isAllowed } = useSubscriptionGate(GatedActions.MakePrivate)
  const { showModal } = useModalContext()

  const handleClick = async () => {
    if (isNsfw) {
      message.warning(`Item is marked NSFW. Can not make it public.`)
      return
    }

    if (!isAllowed) {
      showModal(MODAL_TYPES.SUBSCRIPTION_GATE_MODAL, {
        usesUrl: false,
        minimumSubscriptionTier: SubscriptionTier.Basic,
        featureName: 'Private Creations',
      })
      return
    }

    // setIsLoading(true)
    try {
      await axios.patch(`/api/${itemType}s/${itemId}`, {
        update: { isPrivate: false },
      })
      message.destroy()
      message.success(`${itemType} set to public`)

      onChange && onChange({ isPrivate: false })
    } catch (err) {
      handleAxiosError(err, message)
    }
  }

  if (isNsfw) {
    return (
      <Tooltip
        title="Creations flagged as NSFW can not be made public"
        trigger={['click', 'hover']}
      >
        <div className="w-full">
          <ButtonElement
            label={label || ''}
            itemType={itemType}
            handleClick={() => handleClick()}
            isAllowed={false}
          />
        </div>
      </Tooltip>
    )
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
            handleClick={() => handleClick()}
            isAllowed={isAllowed}
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
      isAllowed={true}
    />
  )
}

export default MakePublicButton
