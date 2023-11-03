import CircleButton from '@/components/Layout/buttons/CircleButton'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import { App } from 'antd'
import { useState } from 'react'

async function checkImageClipboardSupport() {
  try {
    // Create a dummy canvas to use as an image
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d')
    context?.fillRect(0, 0, 1, 1)

    // Try to write the dummy image to the clipboard
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png'),
    )
    if (!blob) throw new Error('Failed to create blob from canvas')

    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])

    // If no error was thrown, writing images to the clipboard is supported
    return true
  } catch {
    // If an error was thrown, writing images to the clipboard is not supported
    return false
  }
}

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
    if (
      !navigator.clipboard ||
      !navigator.clipboard.write ||
      !(await checkImageClipboardSupport())
    ) {
      message.warning(
        `Copy image to clipboard not supported. Please download image instead.`,
      )
      return
    }
    message.open({
      type: 'loading',
      content: 'Copying image...',
      key: 'copyClip',
    })

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
    message.open({
      type: 'success',
      content: 'Copied image to clipboard!',
      key: 'copyClip',
      duration: 3,
    })
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
