import { handleAxiosError } from '@/lib/fetcher'
import TagFaces from '@mui/icons-material/TagFaces'
import { App } from 'antd'
import axios from 'axios'
import { ReactElement } from 'react'

const ButtonElement = ({
  label,
  handleClick,
  isAllowed,
  children,
}: {
  label: string
  handleClick: () => void
  isAllowed: boolean
  children?: ReactElement
}) => {
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 w-full ${
        !isAllowed ? 'text-gray-500' : ''
      }`}
      title={'Publish to HuggingFace'}
    >
      {children ? children : null}
      <div>{label}</div>
      <TagFaces className="text-xl ml-auto" />
    </div>
  )
}

const ExportConcept = ({
  conceptId,
  label,
}: {
  conceptId: string
  label?: string
}) => {
  const { message } = App.useApp()

  const publishToHuggingFace = async (conceptId: string) => {
    const hide = message.loading({
      content: 'Publishing to HuggingFace...',
      key: 'hf',
      duration: 0,
    })
    try {
      const response = await axios.post('/api/concepts/export/hf', {
        conceptId,
      })
      const { url } = response.data
      hide()
      message.success(`Exported to HuggingFace: ${url}`)
    } catch (error) {
      hide()
      handleAxiosError(error, message)
    }
  }

  return (
    <ButtonElement
      label={label || ''}
      handleClick={() => publishToHuggingFace(conceptId)}
      isAllowed={true}
    />
  )
}

export default ExportConcept
