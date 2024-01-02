import LoadingIndicator from '@/components/LoadingIndicator'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { UserContext } from '@/providers/UserProvider'
import { Character } from '@edenlabs/eden-sdk'
import { Button } from 'antd'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const CharacterList = dynamic(
  () => import('@/components/Characters/CharacterList'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CharactersPageContent = ({
  characters,
}: {
  characters?: Character[]
}) => {
  const router = useRouter()
  const { maybeAuthenticate } = useContext(UserContext)

  const handleCreateCharacterButtonClick = async () => {
    if (!(await maybeAuthenticate())) return
    await router.push('/create/characters/new')
  }

  if (!characters) {
    return <LoadingIndicator />
  }

  return (
    <>
      <h2 className="mb-4">My Characters</h2>
      <CharacterList characters={characters} />
      <div className="flex gap-4 mt-8 flex-wrap justify-between">
        <Button
          className="font-mono pt-2 pb-2 h-10"
          onClick={handleCreateCharacterButtonClick}
        >
          Create new Character
        </Button>
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

  return <CharactersPageContent characters={charactersData} />
}

export default CharactersPage
