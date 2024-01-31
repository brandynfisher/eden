const VideoResult = ({
  src,
  muted,
  loop,
  disableControls,
  onLoad,
  onEnded,
  autoPlay,
  preload,
  className,
}: {
  src: string
  muted?: boolean
  loop?: boolean
  disableControls?: boolean
  onLoad?: () => void
  onEnded?: () => void
  autoPlay?: boolean
  preload?: boolean
  className?: string
}) => {
  return (
    <div className={`ant-image z-10 ${className ? className : ''}`}>
      <video
        src={src}
        className="z-10 object-contain w-full h-full max-w-full rounded-lg"
        autoPlay={autoPlay}
        preload={preload ? 'auto' : undefined}
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
