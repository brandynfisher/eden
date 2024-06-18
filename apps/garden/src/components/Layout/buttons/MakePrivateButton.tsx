import { handleAxiosError } from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
import LockPersonIcon from '@mui/icons-material/LockPerson'
import { sendGTMEvent } from '@next/third-parties/google'
import { App } from 'antd'
import axios from 'axios'
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

  const handleClick = async () => {
    try {
      await axios.patch(`/api/${itemType}s/${itemId}`, {
        update: { isPrivate: true },
      })
      message.destroy()
      message.success(`${itemType} set to private`)
      sendGTMEvent({
        event: 'make-private',
        itemType: itemType,
        itemId: itemId,
      })

      onChange && onChange({ isPrivate: true })
    } catch (err) {
      handleAxiosError(err, message)
    }
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

export default MakePrivateButton
