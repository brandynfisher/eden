import CharacterForm from '@/components/Characters/CharacterForm'
import { useCharacter } from '@/hooks/useCharacter'
import { Character } from '@edenlabs/eden-sdk'
import React, { createContext } from 'react'

interface ICharacterContext {
  character?: Character
}

export const CharacterContext = createContext<ICharacterContext>({
  character: undefined,
})

const CharacterDetailPage = ({ data }: { data: Character }) => {
  const { character: characterData } = useCharacter(data ? data.id : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  const character = characterData || data

  return (
    <CharacterContext.Provider value={{ character }}>
      <h2 className="mb-4">Character Details</h2>
      {character && <CharacterForm character={character} />}
    </CharacterContext.Provider>
  )
}

export default CharacterDetailPage
