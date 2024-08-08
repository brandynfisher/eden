import { Modal } from './modal'
import CreationDetail from '@/features/detail/creation-detail'

type Props = {
  params: { id: string }
}

export default function CreationsModal({ params: { id: creationId } }: Props) {
  return (
    <Modal>
      <CreationDetail id={creationId} />
    </Modal>
  )
}
