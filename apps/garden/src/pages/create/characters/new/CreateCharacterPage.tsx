import LoadingIndicator from '@/components/LoadingIndicator'
import dynamic from 'next/dynamic'
import React from 'react'

const CharacterForm = dynamic(
  () => import('@/components/Characters/CharacterForm'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreateCharacterPage = () => {
  return (
    <>
      <CharacterForm />
    </>
  )
}

export default CreateCharacterPage
