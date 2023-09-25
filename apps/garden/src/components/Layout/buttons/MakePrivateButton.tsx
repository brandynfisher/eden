import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
// import { useState } from 'react';
import LockPersonIcon from '@mui/icons-material/LockPerson'
import { App } from 'antd'
import axios from 'axios'

const MakePrivateButton = ({
  creationId,
  variant,
  label,
}: {
  creationId: string
  variant?: 'text'
  label?: string
}) => {
  const { message } = App.useApp()
  // const [ isLoading, setIsLoading ] = useState(false)

  const onButtonClick = async () => {
    // setIsLoading(true)
    try {
      await axios.patch(`/api/creations/${creationId}`, {
        update: { private: true },
      })
      message.destroy()
      message.success('Creation set to private')
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
        title={'Make creation private'}
      >
        <div>{label}</div>
        <LockPersonIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Make creation private'}
      icon={<LockPersonIcon fontSize="medium" />}
      onClick={() => onButtonClick()}
    />
  )
}

export default MakePrivateButton
