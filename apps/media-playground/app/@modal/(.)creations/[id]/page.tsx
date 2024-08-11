// import { Modal } from './modal'
import CreationDetailModal from '@/components/modal/creation-detail-modal'
import CreationDetail from '@/features/detail/creation-detail'

type Props = {
  params: { id: string }
}

export default function CreationsModal({ params: { id: creationId } }: Props) {
  return (
    <CreationDetailModal>
      <CreationDetail id={creationId} />
    </CreationDetailModal>
  )
}
