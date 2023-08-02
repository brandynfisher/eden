import ChatScenarioUI from '@/components/Scenarios/Chat/ChatScenarioUI'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Character, ScenarioType, SessionEventType } from '@edenlabs/eden-sdk'
import { App, Button, Select } from 'antd'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'

const ChatScenarioPageContent = ({
  characters,
}: {
  characters: Character[]
}) => {
  const { message } = App.useApp()
  const { address } = useContext(UserContext)
  const [activeCharacter, setActiveCharacter] = useState<Character>(
    characters?.[0] as Character,
  )
  const [sessionId, setSessionId] = useState<string>()
  const [activeCharacterName, setActiveCharacterName] = useState<string>()
  const [sessionCreating, setSessionCreating] = useState(false)

  useEffect(() => {
    if (activeCharacter) {
      handleActiveCharacterChange(activeCharacter.name)
    }
  }, [activeCharacter])

  const handleActiveCharacterChange = (characterName: string) => {
    const character = characters?.find(
      character => character.name === characterName,
    )
    setActiveCharacter(character as Character)
    setActiveCharacterName(character?.name as string)
  }

  const handleStartChat = async () => {
    setSessionCreating(true)
    try {
      const response = await axios.post('/api/sessions/create', {
        type: ScenarioType.CHATROOM,
      })
      const { sessionId } = response.data

      const userAddEvent = {
        sessionId,
        type: SessionEventType.USER_ADD,
        data: {
          userAdded: {
            userId: address,
          },
        },
      }
      await axios.post('/api/sessions/update', userAddEvent)

      const characterAddEvent = {
        sessionId,
        type: SessionEventType.CHARACTER_ADD,
        data: {
          characterAdded: {
            character: activeCharacter.id,
          },
        },
      }

      await axios.post('/api/sessions/update', characterAddEvent)
      setSessionId(sessionId)
    } catch (error) {
      handleAxiosError(error, message)
    }
    setSessionCreating(false)
  }

  return (
    <div className="flex flex-col h-full">
      {!sessionId ? (
        <>
          <label htmlFor="character-select">Select a Character:</label>
          <div className="w-full flex flex-col space-y-4 mt-2 mb-4">
            <Select
              id="character-select"
              value={activeCharacterName}
              onChange={handleActiveCharacterChange}
            >
              {characters &&
                characters.map(character => (
                  <Select.Option key={character.id} value={character.name}>
                    {character.name}
                  </Select.Option>
                ))}
            </Select>
          </div>
          <Button
            className={`font-mono px-2 text-black dark:text-gray-300 hover:!text-gray-100 bg-gray-200 dark:bg-gray-900 hover:!bg-gray-500 hover:dark:!bg-gray-800`}
            onClick={handleStartChat}
            loading={sessionCreating}
          >
            Select Character
          </Button>
        </>
      ) : (
        <ChatScenarioUI
          activeCharacter={activeCharacter}
          sessionId={sessionId}
        />
      )}
    </div>
  )
}

const ChatScenarioPage = ({ data }: { data: Character[] }) => {
  const { isAuthenticated, address } = useContext(UserContext)
  const { characters: charactersData } = useMyCharacters({
    userId: address ? address : null,
    isAuthenticated,
    options: {
      fallbackData: data,
    },
  })

  if (!data) {
    return null
  }

  return <ChatScenarioPageContent characters={charactersData || data} />
}

export default ChatScenarioPage
