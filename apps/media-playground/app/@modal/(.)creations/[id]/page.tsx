import FullScreenModal from '@/components/modal/full-screen-modal'
import CreationDetail from '@/features/detail/creation-detail'

type Props = {
  params: { id: string }
}

export default function CreationsModalPage({
  params: { id: creationId },
}: Props) {
  return (
    <FullScreenModal className="md:h-[calc(100dvh_-_32px)] md:w-[calc(100dvw_-_32px)]">
      <CreationDetail id={creationId} isModal={true} />
    </FullScreenModal>
  )
}
