import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
// import { useState } from 'react';
import LockPersonIcon from '@mui/icons-material/LockPerson'
import { App } from 'antd'
import axios from 'axios'

const MakePrivateButton = ({
  itemId,
  itemType,
  variant,
  label,
  onChange,
}: {
  itemId: string
  itemType: 'creation' | 'concept'
  variant?: 'text'
  label?: string
  onChange?: (visibilityUpdate: { isPrivate: boolean }) => void
}) => {
  const { message } = App.useApp()
  // const [ isLoading, setIsLoading ] = useState(false)

  const onButtonClick = async () => {
    // setIsLoading(true)
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
    // setIsLoading(false)
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => onButtonClick()}
        className="flex items-center gap-2 w-full justify-between"
        title={`Make ${itemType} private`}
      >
        <div>{label}</div>
        <LockPersonIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={`Make ${itemType} private`}
      icon={<LockPersonIcon fontSize="medium" />}
      onClick={() => onButtonClick()}
    />
  )
}

export default MakePrivateButton
