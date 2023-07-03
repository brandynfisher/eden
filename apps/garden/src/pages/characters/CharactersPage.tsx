import CharacterTable from '@/components/Characters/CharacterTable'
import { requireAuth } from '@/lib/auth'
import { UserContext } from '@/providers/UserProvider'
import { App, Button } from 'antd'
import router from 'next/router'
import { useContext } from 'react'

const CharactersPage = () => {
  const { message } = App.useApp()
  const { characters, isAuthenticated, authenticate } = useContext(UserContext)

  const handleCreateCharacterButtonClick = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }
    if (characters && characters.length >= 5) {
      message.destroy()
      message.error('You can only have 5 characters at once.')
    } else {
      await router.push('/characters/create')
    }
  }

  return (
    <>
      <div className="mb-4">
        <Button
          className="font-mono bg-black text-white pt-2 pb-2 h-10"
          onClick={handleCreateCharacterButtonClick}
        >
          Create Character
        </Button>
      </div>
      <CharacterTable />
    </>
  )
}

export default CharactersPage
