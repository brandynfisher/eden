import CharacterList from '@/components/Characters/CharacterList'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { requireAuth } from '@/lib/auth'
import { UserContext } from '@/providers/UserProvider'
import { Character } from '@edenlabs/eden-sdk'
import { Alert, App, Button } from 'antd'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const maxCharacters = 5

const CharactersPageContent = ({ characters }: { characters: Character[] }) => {
  const router = useRouter()
  const { message } = App.useApp()
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const hasReachedMaxChars = characters && characters.length >= maxCharacters

  const handleCreateCharacterButtonClick = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }
    if (hasReachedMaxChars) {
      message.destroy()
      message.error('You can only have 5 characters at once.')
    } else {
      await router.push('/characters/create')
    }
  }

  return (
    <>
      <h2 className="mb-4">Characters</h2>
      <CharacterList characters={characters} />
      <div className="flex gap-4 mt-8 flex-wrap justify-between">
        <Button
          className="font-mono bg-black text-white pt-2 pb-2 h-10"
          onClick={handleCreateCharacterButtonClick}
          disabled={hasReachedMaxChars}
        >
          Create new Character
        </Button>

        {hasReachedMaxChars && (
          <Alert
            message="You can only have 5 characters at once"
            type="info"
            className="mb-4 w-fit"
          />
        )}
      </div>
    </>
  )
}

const CharactersPage = ({ data }: { data: Character[] }) => {
  const { isAuthenticated, userId } = useContext(UserContext)
  const { characters: charactersData } = useMyCharacters({
    userId,
    isAuthenticated,
    options: {
      fallbackData: data,
    },
  })

  if (!data) {
    return null
  }

  return <CharactersPageContent characters={charactersData || data} />
}

export default CharactersPage
