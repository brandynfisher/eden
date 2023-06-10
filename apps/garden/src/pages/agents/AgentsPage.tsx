import CharacterTable from '@/components/Characters/CharacterTable'
import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import router from 'next/router'
import { useContext } from 'react'
import { toast } from 'react-toastify'

const AgentsPage = () => {
  const { characters } = useContext(UserContext)

  const handleCreateCharacterButtonClick = () => {
    if (characters && characters.length >= 5) {
      toast.error('You can only have 5 characters at once.')
    } else {
      router.push('/agents/create')
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

export default AgentsPage
