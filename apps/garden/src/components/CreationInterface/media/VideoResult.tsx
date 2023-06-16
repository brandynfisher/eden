const VideoResult = ({ resultUrl }: { resultUrl: string }) => {
  return (
    <video
      src={resultUrl}
      style={{ width: '100%', height: 'auto' }}
      autoPlay={true}
      muted={true}
      loop={true}
      controls={true}
    />
  )
}

export default VideoResult
