import { CldOgImage, CldOgImageProps } from 'next-cloudinary'

const cloudConfig = {
  cloud: {
    cloudName:  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  }
}

const CdnOgImage = (props: CldOgImageProps) => {
  if (props.src && props.src.startsWith('https://res.cloudinary.com/')) {
    return (
      <CldOgImage {...props} config={cloudConfig}/>
    )
  }

  return null
}

export default CdnOgImage