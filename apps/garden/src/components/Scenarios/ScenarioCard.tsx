import { Scenario } from '@eden-labs/eden-sdk'
import { Card } from 'antd'
import React from 'react'

const ScenarioCard = ({ scenario }: { scenario: Scenario }) => {
  return (
    <Card className="font-mono">
      <h3 className="font-mono font-bold text-l">{scenario.name}</h3>
      <p className="font-mono">{scenario.description}</p>
    </Card>
  )
}

export default ScenarioCard
