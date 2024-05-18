import CldOgImage, { CldOgImageProps } from '@/components/Media/next-cloudinary/CldOgImage/CldOgImage'

const CdnOgImage = (props: CldOgImageProps) => {
  if (props.src && props.src.startsWith('https://res.cloudinary.com/')) {
    return (
      <CldOgImage {...props}/>
    )
  }

  //@todo: else return S3 compatible image/video/media related meta tags

  return null
}

export default CdnOgImage