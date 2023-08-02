import { Scenario } from '@edenlabs/eden-sdk'
import { Card } from 'antd'
import React from 'react'

const ScenarioCard = ({ scenario }: { scenario: Scenario }) => {
  return (
    <Card className="bg-gray-50 dark:bg-gray-900 font-mono hover:border-blue-400 hover:bg-gray-100 hover:dark:border-blue-600 hover:dark:bg-gray-950">
      <h3 className="font-mono font-bold text-l">{scenario.name}</h3>
      <p className="font-mono">{scenario.description}</p>
    </Card>
  )
}

export default ScenarioCard
