import CircleButton from '@/components/Layout/buttons/CircleButton'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import { useRouter } from 'next/router'

const UseAsPresetButton = ({
  creationId,
  variant,
  label,
}: {
  creationId: string
  variant?: 'text'
  label?: string
}) => {
  const router = useRouter()

  const sendToCreate = async (creationId: string) => {
    const query = {
      presetId: creationId,
    }

    await router.push({
      pathname: '/create/creations',
      query,
    })
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => sendToCreate(creationId)}
        className="flex items-center gap-2 w-full justify-between"
        title={'Uses as a generation preset'}
      >
        <div>{label}</div>
        <SettingsSuggestIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Uses as a generation preset'}
      icon={<SettingsSuggestIcon fontSize="medium" />}
      onClick={() => sendToCreate(creationId)}
    />
  )
}

export default UseAsPresetButton
