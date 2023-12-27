import CircleButton from '@/components/Layout/buttons/CircleButton'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
import { useRouter } from 'next/router'

const UseConcept = ({
  conceptId,
  variant,
  label,
}: {
  conceptId: string
  variant?: 'text'
  label?: string
}) => {
  const router = useRouter()

  const sendToCreate = async (conceptId: string) => {
    const query = {
      concept: conceptId,
    }

    await router.push({
      pathname: '/create/creations',
      query,
    })
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => sendToCreate(conceptId)}
        className="flex items-center gap-2 w-full justify-between"
        title={'Create using this concept'}
      >
        <div>{label}</div>
        <ModelTrainingIcon fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Create using this concept'}
      icon={<ModelTrainingIcon fontSize="medium" />}
      onClick={() => sendToCreate(conceptId)}
    />
  )
}

export default UseConcept
