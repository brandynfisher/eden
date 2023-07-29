import ChatScenarioUI from '@/components/Scenarios/Chat/ChatScenarioUI'
import { UserContext } from '@/providers/UserProvider'
import { Character } from '@edenlabs/eden-sdk'
import { Select } from 'antd'
import React, { useContext, useEffect, useState } from 'react'

const ChatScenarioPage = () => {
  const { characters } = useContext(UserContext)
  const [activeCharacter, setActiveCharacter] = useState<Character>(
    characters?.[0] as Character,
  )
  const [activeCharacterName, setActiveCharacterName] = useState<string>()

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

  return (
    <div className="flex flex-col h-full">
      <h2 className="mb-4">Scenario: Chat</h2>
      <label htmlFor="character-select">Selected Character:</label>
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
      {activeCharacter && <ChatScenarioUI activeCharacter={activeCharacter} />}
    </div>
  )
}

export default ChatScenarioPage
