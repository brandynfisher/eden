import ScenarioCard from '@/components/Scenarios/ScenarioCard'
import { Scenario, ScenarioType } from '@eden-labs/eden-sdk'
import { useRouter } from 'next/router'
import React from 'react'

const exampleScenarios: Scenario[] = [
  {
    id: '1',
    name: 'Single Agent Chat',
    description: 'Chat with a single agent',
    type: ScenarioType.CHATROOM,
    data: {},
  },
  {
    id: '2',
    name: 'Multi Agent Chat',
    description: 'Chat with multiple agents',
    type: ScenarioType.CHATROOM,
    data: {},
  },
]

const ScenariosPage = () => {
  const router = useRouter()
  return (
    <>
      <h2 className="font-mono font-bold text-xl">Scenarios</h2>
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
