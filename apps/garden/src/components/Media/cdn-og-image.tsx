import CldOgImage, { CldOgImageProps } from '@/components/Media/next-cloudinary/CldOgImage/CldOgImage'

const CdnOgImage = (props: CldOgImageProps) => {
  if (props.src && props.src.startsWith('https://res.cloudinary.com/')) {
    return (
      <CldOgImage {...props}/>
    )
  }

  return null
}

export default CdnOgImage