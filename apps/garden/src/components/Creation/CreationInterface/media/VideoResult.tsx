const VideoResult = ({
  src,
  disableControls,
  onLoad,
}: {
  src: string
  disableControls?: boolean
  onLoad?: () => void
}) => {
  return (
    <div className="ant-image z-10">
      <video
        src={src}
        className="z-10 object-contain w-full h-full max-w-full rounded-lg"
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
