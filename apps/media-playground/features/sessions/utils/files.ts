export type MediaType = 'image' | 'video' | 'audio' | null

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
