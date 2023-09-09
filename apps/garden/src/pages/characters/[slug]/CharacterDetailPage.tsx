import CharacterForm from '@/components/Characters/CharacterForm'
import { useCharacter } from '@/hooks/useCharacter'
import { Character } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React, { createContext } from 'react'

interface ICharacterContext {
  character?: Character
}

export const CharacterContext = createContext<ICharacterContext>({
  character: undefined,
})

const CharacterDetailPage = () => {
  const router = useRouter()
  const { slug: characterSlug } = router.query
  const { character } = useCharacter(characterSlug)

  return (
    <CharacterContext.Provider value={{ character }}>
      <h2 className="mb-4">Character Details</h2>
      {character && <CharacterForm character={character} />}
    </CharacterContext.Provider>
  )
}

export default CharacterDetailPage
