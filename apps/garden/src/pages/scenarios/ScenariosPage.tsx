import ScenarioCard from '@/components/Scenarios/ScenarioCard'
import { Scenario, ScenarioType } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React from 'react'

const exampleScenarios: Scenario[] = [
  {
    id: '1',
    name: 'Single Character Chat',
    description: 'Chat with a single character',
    type: ScenarioType.CHATROOM,
    data: {},
  },
]

const ScenariosPage = () => {
  const router = useRouter()
  return (
    <>
      <h2 className="mb-8">Scenarios</h2>
      {exampleScenarios.map(scenario => (
        <div
          key={scenario.id}
          className="mt-2 cursor-pointer"
          onClick={() => router.push(`/scenarios/chat`)}
        >
          <ScenarioCard scenario={scenario} />
        </div>
      ))}
    </>
  )
}

export default ScenariosPage
