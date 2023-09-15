import CreateMenu from '@/components/Layout/navigation/CreateMenu'
import ScenarioCard from '@/components/Scenarios/ScenarioCard'
import { Scenario, ScenarioType } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React from 'react'

type ScenarioWithPath = Scenario & { path: string }

const exampleScenarios: ScenarioWithPath[] = [
  {
    id: '1',
    name: 'Character Chat',
    description: 'Chat with a single character',
    type: ScenarioType.CHATROOM,
    path: '/scenarios/chat',
    data: {},
  },
  {
    id: '2',
    name: 'Monologue',
    description: 'Bring characters to life with an animated monologue',
    type: ScenarioType.MONOLOGUE,
    path: '/scenarios/monologue',
    data: {},
  },
]

const ScenariosPage = () => {
  const router = useRouter()
  const handleRouteChange = async (path: string) => {
    await router.push(path)
  }

  return (
    <>
      <CreateMenu />

      <h2 className="mb-4">Scenarios</h2>
      <div className="flex flex-col gap-4">
        {exampleScenarios.map(scenario => (
          <div
            key={scenario.id}
            className="cursor-pointer"
            onClick={() => handleRouteChange(scenario.path)}
          >
            <ScenarioCard scenario={scenario} />
          </div>
        ))}
      </div>
    </>
  )
}

export default ScenariosPage
