const VideoResult = ({
  resultUrl,
  disableControls,
  onLoad,
}: {
  resultUrl: string
  disableControls?: boolean
  onLoad?: () => void
}) => {
  return (
    <video
      src={resultUrl}
      style={{ width: '100%' }}
      autoPlay={true}
      muted={true}
      loop={true}
      controls={!disableControls}
      onLoad={onLoad}
    />
  )
}

export default VideoResult
