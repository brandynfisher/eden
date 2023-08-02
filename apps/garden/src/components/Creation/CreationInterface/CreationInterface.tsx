import CreationPresetInfo from '@/components/Creation/CreationInterface/CreationPresetInfo'
import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import ResultPreview from '@/components/Creation/CreationInterface/ResultPreview'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { EdenContext } from '@/providers/EdenProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { Select } from 'antd'
import React, { useCallback, useContext, useEffect, useState } from 'react'

const CreationInterface = ({
  generatorName,
  presetCreation,
}: {
  generatorName?: string
  presetCreation?: Creation
}) => {
  const { generators } = useContext(EdenContext)
  const [activeGenerator, setActiveGenerator] = useState(
    generators?.[0] || undefined,
  )

  const handleGeneratorChange = useCallback(
    (value: string) => {
      const selectedGenerator = generators?.find(
        generator => generator.generatorName === value,
      )
      setActiveGenerator(selectedGenerator)
    },
    [generators],
  )

  useEffect(() => {
    if (generatorName) {
      handleGeneratorChange(generatorName)
      return
    }

    if (presetCreation) {
      handleGeneratorChange(presetCreation.task.generator.generatorName)
      return
    }

    setActiveGenerator(generators?.[0])
  }, [generators, presetCreation, generatorName, handleGeneratorChange])

  if (!generators || !activeGenerator) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full">
      <h2 className="mb-4">Create</h2>
      <div className="w-full grid grid-cols-12" style={{ gap: '16px' }}>
        <div className="flex flex-col space-y-4 col-span-12 lg:col-span-6">
          {presetCreation && <CreationPresetInfo creation={presetCreation} />}
          <label htmlFor="activeGenerator">Selected Generator:</label>
          <Select
            id="activeGenerator"
            value={activeGenerator?.generatorName}
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
          {activeGenerator && (
            <GeneratorForm
              generator={activeGenerator}
              presetCreation={presetCreation}
            />
          )}
        </div>

        <ResultPreview />
      </div>

      {CONFIG.DEV_TYPE === 'dummy' && <TestGeneratorInterface />}
    </div>
  )
}

export default CreationInterface
