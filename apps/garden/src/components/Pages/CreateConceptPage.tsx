import LoadingIndicator from '@/components/LoadingIndicator'
import dynamic from 'next/dynamic'
import React from 'react'

const CreationInterface = dynamic(
  () => import('@/components/Creation/CreationInterface/CreationInterface'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreateConceptPage = () => {
  return <CreationInterface selectedGenerators={['sdxl-lora-trainer']} />
}

export default CreateConceptPage
