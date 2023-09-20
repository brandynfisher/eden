import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import VideoResult from '@/components/Creation/CreationInterface/media/VideoResult'
import { getAspectRatio } from '@/lib/media'
import { formatDuration } from '@/lib/time'
import { Creation } from '@edenlabs/eden-sdk'
import { Badge } from 'antd'

const VideoLengthBadge = ({ duration }: { duration?: number }) => {
  return (
    <Badge className="rounded-full mx-2 mt-2 h-[32px] flex items-center pointer-events-none">
      <div className="text-xs text-gray-300 opacity-70 flex bg-gray-950 px-2 py-1 rounded-xl">
        {duration ? formatDuration(duration) : '0:00'}
      </div>
    </Badge>
  )
}

const VideoPreview = ({
  creation,
  hovered,
}: {
  creation: Creation
  hovered?: boolean
}) => {
  return (
    <div className="rounded-lg overflow-hidden relative pointer-events-none">
      <ImageResult
        previewSizeUrl={creation.thumbnail || ''}
        aspectRatio={getAspectRatio(
          creation.mediaAttributes.width,
          creation.mediaAttributes.height,
        )}
      />
      {hovered && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <VideoResult resultUrl={creation.uri || ''} disableControls />
        </div>
      )}
      <div
        className={`absolute z-10 inset-0 flex flex-col justify-between items-center pointer-events-none`}
      >
        <VideoLengthBadge duration={creation.mediaAttributes.duration ?? 0} />
      </div>
    </div>
  )
}

export default VideoPreview
