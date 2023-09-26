import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { App } from 'antd'
import axios from 'axios'

const MakePublicButton = ({
  creationId,
  variant,
  label,
  onChange,
}: {
  creationId: string
  variant?: 'text'
  label?: string
  onChange?: (visibilityUpdate: { private: boolean }) => void
}) => {
  const { message } = App.useApp()
  // const [ isLoading, setIsLoading ] = useState(false)

  const onButtonClick = async () => {
    // setIsLoading(true)
    try {
      await axios.patch(`/api/creations/${creationId}`, {
        update: { private: false },
      })
      message.destroy()
      message.success('Creation set to public')

      onChange && onChange({ private: false })
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
        title={'Make creation public'}
      >
        <div>{label}</div>
        <LockOpenIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Make creation public'}
      icon={<LockOpenIcon fontSize="medium" />}
      onClick={() => onButtonClick()}
    />
  )
}

export default MakePublicButton
