import CircleButton from '@/components/Layout/buttons/CircleButton'
import { handleAxiosError } from '@/lib/fetcher'
import TagFaces from '@mui/icons-material/TagFaces'
import { App } from 'antd'
import axios from 'axios'

const ExportConcept = ({
  conceptId,
  variant,
  label,
}: {
  conceptId: string
  variant?: 'text'
  label?: string
}) => {
  const { message } = App.useApp()
  const publishToHuggingFace = async (conceptId: string) => {
    try {
      const response = await axios.post('/api/concepts/export/hf', {
        conceptId,
      })
      const { url } = response.data
      message.success(`Exported to HuggingFace: ${url}`)
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => publishToHuggingFace(conceptId)}
        className="flex items-center gap-2 w-full justify-between"
        title={'Publish to HuggingFace'}
      >
        <div>{label}</div>
        <TagFaces fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Publish to Huggingface'}
      icon={<TagFaces fontSize="medium" />}
      onClick={() => publishToHuggingFace(conceptId)}
    />
  )
}

export default ExportConcept
