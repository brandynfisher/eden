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
    <div className="ant-image">
      <video
        src={resultUrl}
        className="z-10 object-contain max-w-full rounded-lg"
        autoPlay={true}
        muted={true}
        loop={true}
        controls={!disableControls}
        onPlay={onLoad}
      />
    </div>
  )
}

export default VideoResult
