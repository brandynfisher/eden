import MediaPreview from '@/components/Creation/CreationInterface/media/MediaPreview'
import { Creation } from '@edenlabs/eden-sdk'

const CreationCardPreview = ({
  creation,
  hovered,
}: {
  creation: Creation
  hovered: boolean
}) => {
  return <MediaPreview creation={creation} hovered={hovered} />
}

export default CreationCardPreview
