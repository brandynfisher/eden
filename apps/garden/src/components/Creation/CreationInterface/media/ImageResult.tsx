import { Image } from 'antd'

const ImageResult = ({ resultUrl }: { resultUrl: string }) => {
  return (
    <Image
      src={resultUrl}
      style={{ width: '100%', height: '100%' }}
      alt="result"
      fallback="placeholder.png"
      preview={false}
    />
  )
}

export default ImageResult
