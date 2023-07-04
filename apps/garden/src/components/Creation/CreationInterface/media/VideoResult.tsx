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
      style={{ width: '100%', height: 'auto' }}
      autoPlay={true}
      muted={true}
      loop={true}
      controls={disableControls ? false : true}
    />
  )
}

export default VideoResult
