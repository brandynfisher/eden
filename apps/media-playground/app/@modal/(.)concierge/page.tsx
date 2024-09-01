import FullScreenModal from '@/components/modal/full-screen-modal'
import ConciergeContent from '@/features/concierge/concierge-content'

export default function ConciergeModalPage() {
  return (
    <FullScreenModal
      title="Concierge"
      className="flex self-center p-8 !w-auto !max-w-screen-2xl"
    >
      <ConciergeContent />
    </FullScreenModal>
  )
}
