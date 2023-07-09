import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import ResultPreview from '@/components/Creation/CreationInterface/ResultPreview'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import { CONFIG } from '@/lib/config'
import { EdenContext } from '@/providers/EdenProvider'
import { Select, Spin } from 'antd'
import React, { useContext, useState } from 'react'

const CreationInterface = () => {
  const { generators } = useContext(EdenContext)
  const [activeGenerator, setActiveGenerator] = useState(
    generators?.[0] || undefined,
  )
  const activeGeneratorName = activeGenerator?.generatorName

  if (!generators) {
    return <Spin />
  }

  const handleGeneratorChange = (value: string) => {
    const selectedGenerator = generators.find(
      generator => generator.generatorName === value,
    )
    setActiveGenerator(selectedGenerator)
  }

  return (
    <div className="w-full grid grid-cols-12" style={{ gap: '16px' }}>
      <div className="flex flex-col space-y-4 col-span-12 lg:col-span-6">
        <label htmlFor="activeGenerator">Selected Generator:</label>
        <Select
          id="activeGenerator"
          value={activeGeneratorName}
          onChange={handleGeneratorChange}
          placeholder="Generators"
        >
          {generators.map(generator => (
            <Select.Option
              key={generator.generatorName}
              value={generator.generatorName}
            >
              {generator.generatorName}
            </Select.Option>
          ))}
        </Select>
        {activeGenerator && <GeneratorForm generator={activeGenerator} />}
      </div>

      <ResultPreview />
      {CONFIG.DEV_TYPE === 'dummy' && <TestGeneratorInterface />}
    </div>
  )
}

export default CreationInterface
