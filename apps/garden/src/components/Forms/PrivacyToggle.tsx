import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { WorkspacePremium } from '@mui/icons-material'
import HelpOutline from '@mui/icons-material/HelpOutline'
import { Form, Popover, Switch } from 'antd'
import React from 'react'
import { sendGTMEvent } from '@next/third-parties/google'

const PrivacyToggle = () => {
  const { isAllowed } = useSubscriptionGate(GatedActions.MakePrivate)

  const { showModal } = useModalContext()
  const handleClick = async (ev: React.MouseEvent) => {
    sendGTMEvent({ event: 'create-private-toggle', hasPermission: isAllowed })
    if (!isAllowed) {
      ev.stopPropagation()
      ev.preventDefault()

      showModal(MODAL_TYPES.SUBSCRIPTION_GATE_MODAL, {
        usesUrl: false,
        minimumSubscriptionTier: SubscriptionTier.Basic,
        featureName: 'Private Creations',
      })
      return
    }
  }

  return (
    <div className="flex gap-2 justify-between items-center text-gray-400">
      {isAllowed ? (
        <Form.Item name="isPrivate" valuePropName="checked" className="!mb-0">
          <Switch />
        </Form.Item>
      ) : (
        <Form.Item name="isPrivate" valuePropName="checked" className="!mb-0">
          <div
            onClick={handleClick}
            className="cursor-pointer flex items-center gap-1"
          >
            <WorkspacePremium fontSize="small" className="text-orange-300" />
            <Switch className="pointer-events-none" />
          </div>
        </Form.Item>
      )}
      <label
        htmlFor={'isPrivate'}
        className="text-gray-500 hover:text-gray-500 dark:text-white hover:dark:text-white"
      >
        Private
      </label>
      <Popover
        content={
          <div>
            Private creations will only be visible to yourself and will never
            show in feeds <br /> You can change this later.
          </div>
        }
        title="Privacy Toggle"
        trigger={['click', 'hover']}
      >
        <HelpOutline fontSize="small" className="hover:text-blue-400" />
      </Popover>
    </div>
  )
}

export default PrivacyToggle
