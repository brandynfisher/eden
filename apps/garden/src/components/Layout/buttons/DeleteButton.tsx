import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
import { ItemType } from '@/providers/ModalProvider'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { App } from 'antd'
import axios from 'axios'

// import { useState } from 'react';
const DeleteButton = ({
  itemId,
  itemType,
  variant,
  label,
  onChange,
}: {
  itemId: string
  itemType: ItemType
  variant?: 'text'
  label?: string
  onChange?: () => void
}) => {
  const { message } = App.useApp()
  // const [ isLoading, setIsLoading ] = useState(false)

  const onButtonClick = async () => {
    // setIsLoading(true)
    try {
      await axios.delete(`/api/${itemType}s/${itemId}`)
      message.destroy()
      message.success(`${itemType} deleted`)
      onChange && onChange()
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
        title={`Delete ${itemType}`}
      >
        <div>{label}</div>
        <DeleteForeverIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={`Delete ${itemType}`}
      icon={<DeleteForeverIcon fontSize="medium" className="text-red-500" />}
      onClick={() => onButtonClick()}
    />
  )
}

export default DeleteButton
