import { Capability } from '@eden-labs/eden-sdk'
import { Card } from 'antd'
import React from 'react'

const CapabilityCard = ({
  capability,
}: // mutateCapabilities,
{
  capability: Capability
  mutateCapabilities: VoidFunction
}) => {
  return (
    <>
      <Card className="font-mono">{capability.name}</Card>
    </>
  )
}

export default CapabilityCard
