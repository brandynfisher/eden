import LoadingIndicator from '@/components/LoadingIndicator'
import { Scenario, ScenarioType } from '@edenlabs/eden-sdk'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React from 'react'

type ScenarioWithPath = Scenario & { path: string }

const exampleScenarios: ScenarioWithPath[] = [
  {
    id: '1',
    name: 'Single Character Chat',
    description: 'Chat with a single character',
    type: ScenarioType.CHATROOM,
    path: '/scenarios/chat',
    data: {},
  },
  {
    id: '2',
    name: 'Talking Head',
    description: 'Bring characters to life with voice and animation',
    type: ScenarioType.TALKINGHEAD,
    path: '/scenarios/talkinghead',
    data: {},
  },
]

const CreateMenu = dynamic(
  () => import('@/components/Layout/navigation/CreateMenu'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const ScenarioCard = dynamic(
  () => import('@/components/Scenarios/ScenarioCard'),
  {
    loading: () => <LoadingIndicator />,
  },
)

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
