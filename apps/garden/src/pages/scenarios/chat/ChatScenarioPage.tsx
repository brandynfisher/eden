import ChatScenarioUI from '@/components/Scenarios/Chat/ChatScenarioUI'
import { UserContext } from '@/providers/UserProvider'
import { Agent } from '@eden-labs/eden-sdk'
import { Select } from 'antd'
import React, { useContext, useState } from 'react'

const ChatScenarioPage = () => {
  const { characters } = useContext(UserContext)
  const [activeCharacter, setActiveCharacter] = useState<Agent>(
    characters?.[0] as Agent,
  )
  const [activeCharacterName, setActiveCharacterName] = useState<string>('')

  const handleActiveCharacterChange = (characterName: string) => {
    const character = characters?.find(
      character => character.name === characterName,
    )
    setActiveCharacter(character as Agent)
    setActiveCharacterName(character?.name as string)
  }

  return (
    <>
      <label htmlFor="activeCharacter">Selected Character:</label>
      <div className="w-full flex flex-col space-y-4">
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
    </>
  )
}

export default ChatScenarioPage
