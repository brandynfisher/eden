import ConceptDetail from '@/components/Concept/ConceptDetail/ConceptDetail'
import { Concept } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'

const ConceptDetailModal = ({ concept, ...rest }: { concept: Concept }) => {
  return (
    <Modal {...rest}>
      <ConceptDetail concept={concept} isModal={true} />
    </Modal>
  )
}

export default ConceptDetailModal
