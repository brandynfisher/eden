import LoadingIndicator from '@/components/LoadingIndicator'
import dynamic from 'next/dynamic'
import React from 'react'

const ConceptInterface = dynamic(
  () => import('@/components/Concept/ConceptInterface/ConceptInterface'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreateConceptPage = () => {
  return (
    <div>
      <ConceptInterface />
    </div>
  )
}

export default CreateConceptPage
