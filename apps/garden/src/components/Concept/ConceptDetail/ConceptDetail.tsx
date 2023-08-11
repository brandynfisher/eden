import { Concept } from '@edenlabs/eden-sdk'

const ConceptDetail = ({
  concept,
  isModal,
}: {
  concept: Concept
  isModal?: boolean
}) => {
  return (
    <div>
      <div>ConceptDetail.tsx</div>
      <div>{JSON.stringify(concept, null, 2)}</div>
      <div>isModal {isModal}</div>
    </div>
  )
}

export default ConceptDetail
