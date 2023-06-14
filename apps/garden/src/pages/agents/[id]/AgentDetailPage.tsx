import CapabilityCard from '@/components/Characters/Capability/CapabilityCard'
import { useCharacter } from '@/hooks/useCharacter'
import { Agent } from '@eden-labs/eden-sdk'
import { Button } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

interface ICharacterContext {
  character?: Agent
}

export const CharacterContext = React.createContext<ICharacterContext>({
  character: undefined,
})

const CharacterPage = () => {
  const router = useRouter()
  const { id: characterId } = router.query
  const { character, mutate: mutateCapabilities } = useCharacter(characterId)
  const capabilities = character?.capabilities

  return (
    <CharacterContext.Provider value={{ character }}>
      <h2 className="font-mono font-bold text-xl">Character Details</h2>
      <h3 className="font-mono mt-4">Capabilities</h3>
      {capabilities && capabilities.length > 0
        ? capabilities.map((capability, idx) => (
            <div key={idx} className="mt-2 border-2 border-black  rounded-lg">
              <CapabilityCard
                key={idx}
                capability={capability}
                mutateCapabilities={mutateCapabilities}
              />
            </div>
          ))
        : null}
      <Link href={`/agents/${characterId}/capabilities`}>
        <Button className="font-mono mt-4 text-white bg-black h-10">
          Create Capability
        </Button>
      </Link>
    </CharacterContext.Provider>
  )
}

export default CharacterPage
