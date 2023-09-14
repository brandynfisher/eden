import CircleButton from '@/components/Layout/buttons/CircleButton'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useClipboard } from '@mantine/hooks'
import { LinkOutlined } from '@mui/icons-material'
import { App } from 'antd'

const CopyUrlButton = ({
  url,
  variant,
  label,
}: {
  url: string
  variant?: 'text'
  label?: string
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })
  const handleCopyUrl = async (pageUrl: string) => {
    await copy(pageUrl)

    message.destroy()
    message.success(`Copied url to clipboard!`)
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => handleCopyUrl(url)}
        className="flex items-center gap-2  w-full justify-between"
        title={'Copy URL to Clipboard'}
      >
        <div>{label}</div>
        <LinkOutlined />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Copy Page URL'}
      icon={
        copied ? (
          <CheckCircleOutlined className="text-xl" />
        ) : (
          <LinkOutlined fontSize="medium" />
        )
      }
      onClick={() => handleCopyUrl(url)}
    />
  )
}

export default CopyUrlButton
