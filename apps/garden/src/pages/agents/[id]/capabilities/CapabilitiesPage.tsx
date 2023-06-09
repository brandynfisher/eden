import ChatCapabilityForm from '@/components/Characters/Capability/ChatCapability/ChatCapabilityForm'
import { CapabilityType } from '@/lib/types'
import { Form, Select } from 'antd'
import React from 'react'

const capabilityLabelMap: Record<CapabilityType, string> = {
  [CapabilityType.CHAT]: 'Chat',
}

const capabilityComponentMap: Record<CapabilityType, JSX.Element> = {
  [CapabilityType.CHAT]: <ChatCapabilityForm />,
}

const CapabilitiesPage = () => {
  const [capabilityType, setCapabilityType] = React.useState<
    CapabilityType | undefined
  >()

  const handleChange = (value: CapabilityType) => {
    setCapabilityType(value)
  }

  return (
    <>
      <h1 className="font-mono font-bold text-lg">Create a Capability</h1>
      <p className="font-mono mt-4 mb-2">Choose a Capability Type:</p>
      <Form>
        <Form.Item>
          <Select onChange={handleChange}>
            {Object.values(CapabilityType).map((capability, idx) => (
              <Select.Option key={idx} value={capability}>
                {capabilityLabelMap[capability as CapabilityType]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
      {capabilityComponentMap[capabilityType as CapabilityType]}
    </>
  )
}

export default CapabilitiesPage
