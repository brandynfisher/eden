import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { App, Popover } from 'antd'
import axios from 'axios'
import React from 'react'

const MakePublicButton = ({
  itemId,
  itemType,
  variant,
  label,
  onChange,
  isNsfw,
}: {
  itemId: string
  itemType: 'creation' | 'concept'
  variant?: 'text'
  label?: string
  onChange?: (visibilityUpdate: { isPrivate: boolean }) => void
  isNsfw?: boolean
}) => {
  const { message } = App.useApp()
  // const [ isLoading, setIsLoading ] = useState(false)

  const onButtonClick = async () => {
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
    // setIsLoading(false)
  }

  if (variant === 'text') {
    return (
      <>
        {isNsfw ? (
          <Popover
            style={{ zIndex: 1051 }}
            title="NSFW"
            content={'Creations flagged as NSFW can not be made public'}
            trigger={['click', 'hover']}
          >
            <div
              onClick={() => onButtonClick()}
              className="flex items-center gap-2 w-full justify-between"
              title={`Make ${itemType} public`}
            >
              <div>{label}</div>
              <LockOpenIcon fontSize="small" />
            </div>
          </Popover>
        ) : (
          <div
            onClick={() => onButtonClick()}
            className="flex items-center gap-2 w-full justify-between"
            title={`Make ${itemType} public`}
          >
            <div>{label}</div>
            <LockOpenIcon fontSize="small" />
          </div>
        )}
      </>
    )
  }

  return (
    <CircleButton
      title={`Make ${itemType} public`}
      icon={<LockOpenIcon fontSize="medium" />}
      onClick={() => onButtonClick()}
    />
  )
}

export default MakePublicButton
