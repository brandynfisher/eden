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
        className="ant-image-img object-contain max-w-full"
        autoPlay={true}
        muted={true}
        loop={true}
        controls={!disableControls}
        onLoad={onLoad}
      />
    </div>
  )
}

export default VideoResult
