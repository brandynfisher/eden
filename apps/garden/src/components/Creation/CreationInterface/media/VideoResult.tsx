const VideoResult = ({
  src,
  muted,
  loop,
  disableControls,
  onLoad,
  onEnded,
}: {
  src: string
  muted?: boolean
  loop?: boolean
  disableControls?: boolean
  onLoad?: () => void
  onEnded?: () => void
}) => {
  return (
    <div className="ant-image z-10">
      <video
        src={src}
        className="z-10 object-contain w-full h-full max-w-full rounded-lg"
        autoPlay={true}
        muted={typeof muted !== 'undefined' ? muted : true}
        loop={typeof loop !== 'undefined' ? loop : true}
        controls={!disableControls}
        onPlay={onLoad}
        onEnded={onEnded}
      />
    </div>
  )
}

export default VideoResult
