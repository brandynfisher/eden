type SupportedExtension = 'jpg' | 'webp' | 'mp4' | ''

export const getFileExtension = (url: string): SupportedExtension => {
  const extension = url.split('.').pop()
  if (!extension) {
    throw new Error('Invalid file extension')
  }
  const lowercaseExtension = extension.toLowerCase()
  if (
    !['jpg', 'webp', 'mp4'].includes(lowercaseExtension as SupportedExtension)
  ) {
    return ''
  }
  return lowercaseExtension as SupportedExtension
}
