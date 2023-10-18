import CircleButton from '@/components/Layout/buttons/CircleButton'
import ShareAltOutlined from '@ant-design/icons/ShareAltOutlined'

const ShareLinkButton = ({
  title,
  text,
  label,
  url,
  variant,
}: {
  title?: string
  text?: string
  label: string
  url: string
  variant?: 'text'
}) => {
  const shareNative = async () => {
    try {
      await navigator.share({
        title: title || '',
        text: text || '',
        url: url,
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }
  const handleShare = async () => {
    await shareNative()
  }

  if (variant === 'text') {
    return (
      <div
        onClick={handleShare}
        className="flex items-center gap-2 w-full justify-between"
        title={'Share link'}
      >
        <div>{label}</div>
        <ShareAltOutlined className="text-xl" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Share'}
      icon={<ShareAltOutlined className="text-xl" />}
      onClick={handleShare}
    />
  )
}

export default ShareLinkButton
