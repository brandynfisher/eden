import { env } from '@/lib/config'

export function getCloudfrontUrl(filename?: string, size: number = 2560) {
  if (!filename) {
    return ''
  }

  if (filename.startsWith(env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL)) {
    // if filename is a video or ends with _ followed by any number and then . and any extension, do nothing
    if (filename.endsWith('.mp4') || filename.match(/_\d+\.\w+$/)) {
      return filename
    }

    // otherwise, add the string _2560 before the . and extension and ensure that the extension is webp
    return filename.replace(/\.\w+$/, `_${size}.webp`)
  }

  // any other full url should be returned as is (maybe legacy or whatever)
  if (filename.startsWith('https://')) {
    return filename
  }

  return `${env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${filename}`
}
