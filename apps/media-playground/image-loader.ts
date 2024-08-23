import { getCloudfrontUrl } from '@/lib/media'

enum Formats {
  JPG = 'jpg',
  WEBP = 'webp',
  // Add more here...
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
  return filename.replace(EXTENSION_PATTERN, `.${format}`)
}

export default function customImageLoader({
  src,
  width,
  format = Formats.WEBP,
}: ImageLoaderProps): string {
  // use url as is
  if (src.startsWith('https://')) {
    return src
  }

  // set size and change extensions
  const selectedSize = determineSize(width)
  const srcWithSize = src.replace(EXTENSION_PATTERN, `_${selectedSize}$1`)
  const finalSrc = changeExtension(srcWithSize, format)

  // prepend cloudfront url
  return getCloudfrontUrl(finalSrc)
}
