import { Image } from 'antd'

const ImageResult = ({ resultUrl }: { resultUrl: string }) => {
  return (
    <img
      src={resultUrl}
      style={{ width: '100%', height: 'auto' }}
      alt="result"
    />
  )
}

export default ImageResult
