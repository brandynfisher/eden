import CircleButton from '@/components/Layout/buttons/CircleButton'
import { CheckCircleOutlined, LinkOutlined } from '@ant-design/icons'
import { useClipboard } from '@mantine/hooks'
import { App } from 'antd'

const CopyUrlButton = ({ url }: { url: string }) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })
  const handleCopyUrl = async (pageUrl: string) => {
    await copy(pageUrl)

    message.destroy()
    message.success(`Copied url to clipboard!`)
  }

  return (
    <CircleButton
      title={'Copy Page URL'}
      icon={
        copied ? (
          <CheckCircleOutlined className="text-xl" />
        ) : (
          <LinkOutlined className="text-xl" />
        )
      }
      onClick={() => handleCopyUrl(url)}
    />
  )
}

export default CopyUrlButton
