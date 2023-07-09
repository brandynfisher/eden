import { Image } from 'antd'

const ImageResult = ({ resultUrl }: { resultUrl: string }) => {
  return (
    <Image
      src={resultUrl}
      alt="result"
      fallback="placeholder.png"
      preview={false}
    />
  )
}

export default ImageResult
