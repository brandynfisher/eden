export const sanitize = (text: string) => {
  return text.replace(/[^a-z0-9_\-\s]/gi, '_')
}

export const formatDuration = (duration: number) => {
  // convert number to x:xx format
  const minutes = Math.floor(duration / 60)
  const seconds = Math.ceil(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
