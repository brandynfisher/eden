export const formatDuration = (duration: Duration) => {
  // convert number to x:xx format
  const minutes = Math.floor(duration / 60)
  const seconds = Math.round(duration % 60, 2)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
