import CharacterDetails from '@/components/Characters/CharacterDetails'
import { useCharacter } from '@/hooks/useCharacter'
import { Character } from '@edenlabs/eden-sdk'
import React from 'react'

const CharacterPage = ({ data }: { data: Character }) => {
  const { character: characterData } = useCharacter(data ? data._id : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  return <CharacterDetails character={characterData || data} />
}

export default CharacterPage
