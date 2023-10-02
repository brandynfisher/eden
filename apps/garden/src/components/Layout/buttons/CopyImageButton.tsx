import CircleButton from '@/components/Layout/buttons/CircleButton'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import { App } from 'antd'
import { useState } from 'react'

const CopyImageButton = ({
  url,
  variant,
}: {
  url: string
  variant?: 'text'
}) => {
  const { message } = App.useApp()
  const [copied, setCopied] = useState(false)
  const handleCopyUrl = async (imageUrl: string) => {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const img = await createImageBitmap(blob)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx?.drawImage(img, 0, 0, img.width, img.height)
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Image conversion failed'))
        }
      }, 'image/png')
    })

    const data = [new ClipboardItem({ [pngBlob.type]: pngBlob })]
    await navigator.clipboard.write(data)
    message.destroy()
    message.success(`Copied image to clipboard!`)
    setCopied(true)
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => handleCopyUrl(url)}
        className="flex items-center gap-2 w-full justify-between"
        title={'Copy Image to Clipboard'}
      >
        <div>Image File</div>
        <ImageOutlined fontSize="small" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Copy Image to Clipboard'}
      icon={
        copied ? (
          <CheckCircleOutlineIcon fontSize="medium" />
        ) : (
          <ContentCopyIcon fontSize="medium" />
        )
      }
      onClick={() => handleCopyUrl(url)}
    />
  )
}

export default CopyImageButton
