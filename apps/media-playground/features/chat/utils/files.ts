export function fileMatchesAccept(
  file: { name: string; type: string },
  acceptString: string,
) {
  // Check if the accept string is "*", which allows any file
  if (acceptString === '*') {
    return true
  }

  // Split the accept string into an array of allowed types
  const allowedTypes = acceptString
    .split(',')
    .map(type => type?.trim()?.toLowerCase())

  // Get the file's extension and MIME type
  const fileExtension = '.' + file.name?.split('.').pop()?.toLowerCase()
  const fileMimeType = file.type?.toLowerCase()

  for (const type of allowedTypes) {
    // Check for file extension match
    if (type.startsWith('.') && type === fileExtension) {
      return true
    }

    // Check for exact MIME type match
    if (type.includes('/') && type === fileMimeType) {
      return true
    }

    if (type === 'image/*' || type === 'video/*' || type === 'audio/*') {
      // Check for wildcard MIME type match
      if (type.endsWith('/*')) {
        const generalType = type.split('/')[0]!
        if (fileMimeType.startsWith(generalType + '/')) {
          return true
        }
      }
    }
  }

  return false
}

export type MediaType = 'audio' | 'video' | 'image' | null

export function getSuspectedMediaType(fileUrl: string): MediaType {
  // Get the file extension from the URL
  const extension = fileUrl.split('.').pop()?.toLowerCase()

  if (!extension) return null

  // Common image extensions
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image'
  }

  // Common video extensions
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(extension)) {
    return 'video'
  }

  // Common audio extensions
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'mpeg'].includes(extension)) {
    return 'audio'
  }

  return null
}
