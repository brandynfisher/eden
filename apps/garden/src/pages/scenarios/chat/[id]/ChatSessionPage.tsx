import { useMyCharacters } from '@/hooks/useMyCharacters'
import { useMySessions } from '@/hooks/useMySessions'
import ChatScenarioPage from '@/pages/scenarios/chat/ChatScenarioPage'
import { UserContext } from '@/providers/UserProvider'
import { Character, Session } from '@edenlabs/eden-sdk'
import React, { useContext } from 'react'

const ChatSessionPage = ({
  data,
  activeSessionId,
}: {
  data: { characters: Character[]; sessions: Session[] }
  activeSessionId?: string | undefined
}) => {
  const { isAuthenticated, address } = useContext(UserContext)
  const { characters: charactersData } = useMyCharacters({
    userId: address ? address : null,
    isAuthenticated,
    options: {
      fallbackData: data ? data.characters : [],
    },
  })
  const { sessions: sessionsData } = useMySessions({
    userId: address ? address : null,
    isAuthenticated,
    options: {
      fallbackData: data ? data.sessions : [],
    },
  })

  if (!data) {
    return null
  }

  return (
    <ChatScenarioPage
      data={{
        characters: charactersData || data.characters,
        sessions: sessionsData || data.sessions,
      }}
      activeSessionId={activeSessionId}
    />
  )
}

export default ChatSessionPage
