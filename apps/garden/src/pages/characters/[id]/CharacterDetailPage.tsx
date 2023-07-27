import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { useCharacter } from '@/hooks/useCharacter'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Character } from '@edenlabs/eden-sdk'
import { App, Button } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

interface ICharacterContext {
  character?: Character
}

export const CharacterContext = React.createContext<ICharacterContext>({
  character: undefined,
})

const CharacterToolButtons = ({ character }: { character: Character }) => {
  const { message } = App.useApp()
  const router = useRouter()
  const { refetch } = useContext(UserContext)

  const handleDeleteCharacter = async () => {
    try {
      await axios.post(`/api/characters/delete`, {
        characterId: character.id,
      })
      message.destroy()
      message.info(`Character '${character.name}' was deleted`)
      refetch.characters()
      await router.push('/characters')
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <div className="flex mt-8 justify-between gap-2">
      <div>
        <Button className="font-mono">Save</Button>
        <Button className="font-mono">Cancel</Button>
      </div>

      <Button className="font-mono" danger onClick={handleDeleteCharacter}>
        Delete character
      </Button>
    </div>
  )
}

const CharacterDetailPage = () => {
  const router = useRouter()
  const { id: characterId } = router.query
  const { character } = useCharacter(characterId)

  return (
    <CharacterContext.Provider value={{ character }}>
      <h2 className="mb-8">Character Details</h2>
      {character && (
        <>
          <CharacterAvatar character={character} />
          <div>{character.name}</div>
          <div>{character.description}</div>
          <CharacterToolButtons character={character} />
        </>
      )}
    </CharacterContext.Provider>
  )
}

export default CharacterDetailPage
