import FullScreenModal from '@/components/modal/full-screen-modal'
import ModelDetail from '@/features/detail/model-detail'

type Props = {
  params: { id: string }
}

export default function ModelsModalPage({ params: { id: modelId } }: Props) {
  return (
    <FullScreenModal>
      <ModelDetail id={modelId} isModal={true} />
    </FullScreenModal>
  )
}
