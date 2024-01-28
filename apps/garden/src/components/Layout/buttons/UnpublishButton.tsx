import { handleAxiosError } from '@/lib/fetcher'
import TagFaces from '@mui/icons-material/TagFaces'
import { App } from 'antd'
import axios from 'axios'

const UnpublishButton = ({
  conceptId,
  label,
}: {
  conceptId: string
  label: string
}) => {
  const { message } = App.useApp()

  const unpublishToHuggingFace = async (conceptId: string) => {
    const hide = message.loading({
      content: 'Removing from HuggingFace...',
      key: 'hf',
      duration: 0,
    })
    try {
      await axios.post('/api/concepts/remove/hf', {
        conceptId,
      })
      hide()
      message.success(`Removed from Huggingface`)
    } catch (error) {
      hide()
      handleAxiosError(error, message)
    }
  }

  return (
    <div
      onClick={() => unpublishToHuggingFace(conceptId)}
      className="flex items-center gap-2 w-full justify-between"
      title={'Remove from HuggingFace'}
    >
      <div>{label}</div>
      <TagFaces className="text-xl" />
    </div>
  )
}

export default UnpublishButton
