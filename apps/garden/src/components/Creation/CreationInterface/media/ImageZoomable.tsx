import Image from 'next/image'

const ImageZoomable = ({
  url,
  width,
  height,
}: {
  url: string
  width: number
  height: number
}) => {
  return (
    <div className="relative">
      <div className="relative w-fit overflow-hidden rounded-lg">
        <Image
          src={url}
          alt={url}
          width={width}
          height={height}
          className="object-contain z-10"
        />
      </div>
    </div>
  )
}

export default ImageZoomable
