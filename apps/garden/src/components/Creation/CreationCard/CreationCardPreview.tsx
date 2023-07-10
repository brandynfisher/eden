import MediaPreview from '@/components/Creation/CreationInterface/media/MediaPreview'
import { Creation } from '@eden-labs/eden-sdk'

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
