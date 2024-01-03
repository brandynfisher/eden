import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { WorkspacePremium } from '@mui/icons-material'
import HelpOutline from '@mui/icons-material/HelpOutline'
import { Form, Popover, Switch } from 'antd'
import React from 'react'

const PrivacyToggle = () => {
  const { isAllowed } = useSubscriptionGate(GatedActions.MakePrivate)

  return (
    <div className="flex gap-2 justify-between items-center text-gray-400">
      <WorkspacePremium fontSize="small" className="text-orange-300 " />

      <div
        onClick={() =>
          !isAllowed && alert('You are not allowed to toggle this switch.')
        }
      >
        <Form.Item name="isPrivate" valuePropName="checked" className="!mb-0">
          <Switch disabled={!isAllowed} />
        </Form.Item>
      </div>

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
