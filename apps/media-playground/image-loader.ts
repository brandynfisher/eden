import { getCloudfrontUrl } from '@/lib/media'

export enum Formats {
  WEBP = 'webp',
  PNG = 'png',
}

const SIZES = [384, 768, 1024, 2560]
const EXTENSION_PATTERN = /(\.[\w_-]+)$/i

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
  format?: Formats
}

// Utility function to determine size
function determineSize(width: number): number {
  return SIZES.find(size => size >= width) || SIZES[SIZES.length - 1]
}

// Utility function to change extension
function changeExtension(filename: string, format: Formats): string {
  // console.log(filename, format)
  return filename.replace(EXTENSION_PATTERN, `.${format}`)
}

export default function customImageLoader(args: ImageLoaderProps): string {
  // console.log(args)
  const { src, width, format, quality } = args || {}

  // use url as is
  if (
    src.startsWith('https://') &&
    process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL &&
    !src.startsWith(process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL)
  ) {
    return src
  }

  // set size and change extensions
  const selectedSize = determineSize(width)

  // Handle already sized webp files (e.g., _384.webp, _768.webp, _1024.webp, _2560.webp)
  const sizedWebpMatch = src.match(/_(384|768|1024|2560)\.webp$/)
  if (sizedWebpMatch) {
    // Replace the size with the selected size
    return getCloudfrontUrl(
      src.replace(`_${sizedWebpMatch[1]}`, `_${selectedSize}`),
    )
  }

  const srcWithCDNPrefix = src.startsWith('/')
    ? `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${src}`
    : src

  if (quality === 100) {
    return srcWithCDNPrefix
  }

  const srcWithSize = srcWithCDNPrefix.replace(
    EXTENSION_PATTERN,
    `_${selectedSize}$1`,
  )
  const finalSrc = changeExtension(srcWithSize, format || Formats.WEBP)

  // prepend cloudfront url
  return getCloudfrontUrl(finalSrc)
}
