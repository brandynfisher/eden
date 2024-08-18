import FullScreenModal from '@/components/modal/full-screen-modal'
import ConciergeContent from '@/features/concierge/concierge-content'

export default function CreationsModal() {
  return (
    <FullScreenModal className="flex self-center p-8">
      <ConciergeContent />
    </FullScreenModal>
  )
}
