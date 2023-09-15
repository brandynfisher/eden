import LoadingIndicator from '@/components/LoadingIndicator'
import dynamic from 'next/dynamic'
import React from 'react'

const CreateMenu = dynamic(
  () => import('@/components/Layout/navigation/CreateMenu'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const ConceptInterface = dynamic(
  () => import('@/components/Concept/ConceptInterface/ConceptInterface'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreateConceptPage = () => {
  return (
    <div>
      <CreateMenu />
      <ConceptInterface />
    </div>
  )
}

export default CreateConceptPage
