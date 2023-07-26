import { useCharacter } from '@/hooks/useCharacter'
import { Character } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React from 'react'

interface ICharacterContext {
  character?: Character
}

export const CharacterContext = React.createContext<ICharacterContext>({
  character: undefined,
})

const CharacterDetailPage = () => {
  const router = useRouter()
  const { id: characterId } = router.query
  const { character } = useCharacter(characterId)

  return (
    <CharacterContext.Provider value={{ character }}>
      <h2 className="font-mono font-bold text-xl">Character Details</h2>
      {character && <div>{character.name}</div>}
    </CharacterContext.Provider>
  )
}

export default CharacterDetailPage
