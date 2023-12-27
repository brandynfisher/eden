import ChatScenarioUI from '@/components/Scenarios/Chat/ChatScenarioUI'
import SessionsGrid from '@/components/Scenarios/Chat/SessionsGrid'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { useMySessions } from '@/hooks/useMySessions'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Character, Session } from '@edenlabs/eden-sdk'
import { App, Button, Select } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const ChatScenarioPageContent = ({
  characters,
  sessions,
  activeSessionId,
}: {
  characters: Character[]
  sessions: Session[]
  activeSessionId?: string
}) => {
  const router = useRouter()
  const { message } = App.useApp()
  const [activeCharacter, setActiveCharacter] = useState<Character>(
    characters?.[0] as Character,
  )
  const [sessionId, setSessionId] = useState<string>(activeSessionId || '')
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
      const response = await axios.post('/api/sessions/create', {})
      const { sessionId } = response.data
      setSessionId(sessionId)
      await router.push('', `/characters/chat/${sessionId}`)
    } catch (error) {
      handleAxiosError(error, message)
    }
    setSessionCreating(false)
  }
  return (
    <div className="flex flex-col h-full">
      {!sessionId ? (
        <>
          <SessionsGrid sessions={sessions} />
          <div>
            <h2 className="mb-4">Start new session</h2>
            <label htmlFor="character-select">Select a Character:</label>
            <div className="w-full flex flex-col space-y-4 mt-2 mb-4">
              <Select
                id="character-select"
                value={activeCharacterName}
                onChange={handleActiveCharacterChange}
              >
                {characters &&
                  characters.map(character => (
                    <Select.Option key={character._id} value={character.name}>
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
          </div>
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
const ChatScenarioPage = ({
  data,
  activeSessionId,
}: {
  data?: { characters: Character[]; sessions: Session[] }
  activeSessionId?: string
}) => {
  const { isAuthenticated, userId } = useContext(UserContext)
  const { characters: charactersData } = useMyCharacters({
    userId: userId ? userId : null,
    isAuthenticated,
    options: {
      fallbackData: data ? data.characters : [],
    },
  })
  const { sessions: sessionsData } = useMySessions({
    userId: userId ? userId : null,
    isAuthenticated,
    options: {
      fallbackData: data ? data.sessions : [],
    },
  })
  if (!data) {
    return null
  }
  return (
    <ChatScenarioPageContent
      characters={charactersData || data.characters}
      sessions={sessionsData || data.sessions}
      activeSessionId={activeSessionId}
    />
  )
}
export default ChatScenarioPage
