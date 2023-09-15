import LoadingIndicator from '@/components/LoadingIndicator'
import dynamic from 'next/dynamic'
import React from 'react'

const CreateMenu = dynamic(
  () => import('@/components/Layout/navigation/CreateMenu'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CharacterForm = dynamic(
  () => import('@/components/Characters/CharacterForm'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CreateCharacterPage = () => {
  return (
    <>
      <CreateMenu />
      <CharacterForm />
    </>
  )
}

export default CreateCharacterPage
