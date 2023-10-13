import { HelpOutline } from '@mui/icons-material'
import { Form, Popover, Switch } from 'antd'
import React from 'react'

const PrivacyToggle = () => {
  return (
    <div className="flex gap-2 justify-between items-center text-gray-400">
      <Form.Item name="isPrivate" valuePropName="checked" className="!mb-0">
        <Switch />
      </Form.Item>
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
        trigger="click"
      >
        <HelpOutline fontSize="small" className="hover:text-blue-400" />
      </Popover>
    </div>
  )
}

export default PrivacyToggle
