import FullHeightModal from '@/components/modal/full-height-modal'
import CreationDetail from '@/features/detail/creation-detail'

type Props = {
  params: { id: string }
}

export default function CreationsModal({ params: { id: creationId } }: Props) {
  return (
    <FullHeightModal>
      <CreationDetail id={creationId} isModal={true} />
    </FullHeightModal>
  )
}
