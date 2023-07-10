import { ExpandOutlined } from '@ant-design/icons'
import { Image } from 'antd'

const ImagePreviewMask = () => (
  <div>
    <div className="rounded-full bg-gray-800 h-12 w-12 flex items-center justify-center opacity-70">
      <ExpandOutlined className="text-2xl" />
    </div>
  </div>
)

const ImageResult = ({
  resultUrl,
  previewUrl,
  showPreview,
  onPreviewClose,
}: {
  resultUrl: string
  previewUrl?: string
  showPreview?: boolean
  onPreviewClose?: () => void
}) => {
  return (
    <Image
      src={resultUrl}
      alt="result"
      fallback="placeholder.png"
      className={showPreview ? 'opacity-0' : ''}
      preview={
        previewUrl
          ? {
              src: previewUrl,
              visible: showPreview,
              destroyOnClose: true,
              scaleStep: 0.85,
              onVisibleChange: onPreviewClose
                ? visible => !visible && onPreviewClose()
                : undefined,
              mask: <ImagePreviewMask />,
            }
          : false
      }
    />
  )
}

export default ImageResult
