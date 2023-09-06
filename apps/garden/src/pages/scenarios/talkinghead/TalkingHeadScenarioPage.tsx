import { useMyCharacters } from '@/hooks/useMyCharacters'
import { UserContext } from '@/providers/UserProvider'
import { Character } from '@edenlabs/eden-sdk'
import { Select } from 'antd'
import React, { useContext, useState } from 'react'

const TalkingHeadScenarioPageContent = ({
  characters,
}: {
  characters: Character[]
}) => {
  const [activeCharacter, setActiveCharacter] = useState<Character>(
    characters?.[0] as Character,
  )
  const [activeCharacterName, setActiveCharacterName] = useState<string>(
    activeCharacter && activeCharacter.name,
  )

  const handleActiveCharacterChange = (characterName: string) => {
    const character = characters?.find(
      character => character.name === characterName,
    )
    setActiveCharacter(character as Character)
    setActiveCharacterName(character?.name as string)
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="mb-4">Scenario: Talking Head</h2>
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

      <div>{JSON.stringify(activeCharacter, null, 2)}</div>
      <div>prompt: xxx123</div>
      <div>submit</div>
    </div>
  )
}

const TalkingHeadScenarioPage = ({ data }: { data: Character[] }) => {
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

  return <TalkingHeadScenarioPageContent characters={charactersData || data} />
}

export default TalkingHeadScenarioPage
