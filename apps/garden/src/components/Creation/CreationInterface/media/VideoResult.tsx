const VideoResult = ({
  resultUrl,
  disableControls,
}: {
  resultUrl: string
  disableControls?: boolean
}) => {
  return (
    <video
      src={resultUrl}
      style={{ width: '100%', height: '100%' }}
      autoPlay={true}
      muted={true}
      loop={true}
      controls={!disableControls}
    />
  )
}

export default VideoResult
