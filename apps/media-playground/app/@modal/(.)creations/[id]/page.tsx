import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'

type Props = {
  params: { id: string }
}

export default function CreationsModalPage({
  params: { id: creationId },
}: Props) {
  return (
    <FullScreenModal>
      <CreationDetail id={creationId} isModal={true} />
    </FullScreenModal>
  )
}
