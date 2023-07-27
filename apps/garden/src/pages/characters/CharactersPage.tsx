import CharacterList from '@/components/Characters/CharacterList'
import { requireAuth } from '@/lib/auth'
import { UserContext } from '@/providers/UserProvider'
import { Alert, App, Button } from 'antd'
import { useRouter } from 'next/router'
import { useContext } from 'react'

const maxCharacters = 5

const CharactersPage = () => {
  const router = useRouter()
  const { message } = App.useApp()
  const { characters, isAuthenticated, authenticate } = useContext(UserContext)
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
      <h2 className="mb-8">Characters</h2>
      <CharacterList />
      <div className="mt-8">
        {hasReachedMaxChars && (
          <Alert
            message="You can only have 5 characters at once!"
            type="warning"
            className="mb-4 w-fit"
          />
        )}
        <Button
          className="font-mono bg-black text-white pt-2 pb-2 h-10"
          onClick={handleCreateCharacterButtonClick}
          disabled={hasReachedMaxChars}
        >
          Create new Character
        </Button>
      </div>
    </>
  )
}

export default CharactersPage
