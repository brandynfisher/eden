import CharacterDetails from '@/components/Characters/CharacterDetails'
import { useCharacter } from '@/hooks/useCharacter'
import { Character } from '@edenlabs/eden-sdk'
import React from 'react'

const CharacterPage = ({ initialData }: { initialData: Character }) => {
  const { character: characterData } = useCharacter(initialData ? initialData._id : null, {
    fallbackData: initialData,
  })

  if (!initialData && !characterData) {
    return null
  }

  return <CharacterDetails character={characterData || initialData} />
}

export default CharacterPage
