import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { App } from 'antd'
import axios from 'axios'

// import { useState } from 'react';
const DeleteButton = ({
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
      await axios.delete(`/api/creations/${creationId}`)
      message.destroy()
      message.success('Creation deleted')
    } catch (err) {
      handleAxiosError(err, message)
    }
    // setIsLoading(false)
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => onButtonClick()}
        className="flex items-center gap-2 w-full justify-between text-red-500"
        title={'Delete creation'}
      >
        <div>{label}</div>
        <DeleteForeverIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Delete creation'}
      icon={<DeleteForeverIcon fontSize="medium" className="text-red-500" />}
      onClick={() => onButtonClick()}
    />
  )
}

export default DeleteButton
