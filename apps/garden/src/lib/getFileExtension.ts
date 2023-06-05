type SupportedExtension = 'jpg' | 'webp' | ''

export const getFileExtension = (url: string): SupportedExtension => {
  const extension = url.split('.').pop()
  if (!extension) {
    throw new Error('Invalid file extension')
  }
  const lowercaseExtension = extension.toLowerCase()
  if (!['jpg', 'webp'].includes(lowercaseExtension as SupportedExtension)) {
    return ''
  }
  return lowercaseExtension as SupportedExtension
}
