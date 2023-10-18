import CircleButton from '@/components/Layout/buttons/CircleButton'
import ShareAltOutlined from '@ant-design/icons/ShareAltOutlined'

const ShareButton = ({
  title,
  text,
  url,
}: {
  title: string
  text?: string
  url: string
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

  return (
    <CircleButton
      title={'Share'}
      icon={<ShareAltOutlined className="text-xl" />}
      onClick={handleShare}
    />
  )
}

export default ShareButton
