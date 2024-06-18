import { handleAxiosError } from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { App, Tooltip } from 'antd'
import axios from 'axios'
import React, { ReactElement } from 'react'

const ButtonElement = ({
  label,
  itemType,
  handleClick,
  children,
}: {
  label: string
  itemType: ItemType
  handleClick: () => void
  children?: ReactElement
}) => {
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 w-full`}
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

  const handleClick = async () => {
    if (isNsfw) {
      message.warning(`Item is marked NSFW. Can not make it public.`)
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
          />
        </div>
      </Tooltip>
    )
  }

  return (
    <ButtonElement
      label={label || ''}
      itemType={itemType}
      handleClick={() => handleClick()}
    />
  )
}

export default MakePublicButton
