import CreationPresetInfo from '@/components/Creation/CreationInterface/CreationPresetInfo'
import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import { Creation, Generator } from '@edenlabs/eden-sdk'
import { Select } from 'antd'
import React from 'react'

const CreationWorkspace = ({
  generators,
  presetCreation,
  activeGenerator,
  handleGeneratorChange,
}: {
  generators: Generator[]
  presetCreation?: Creation
  activeGenerator: Generator
  handleGeneratorChange: (generatorName: Generator['generatorName']) => void
}) => {
  return (
    <>
      <div className="w-full">
        {presetCreation && <CreationPresetInfo creation={presetCreation} />}
        <div className="p-4 pb-0 flex bg-gray-800">
          <Select
            id="activeGenerator"
            value={activeGenerator?.generatorName}
            onChange={handleGeneratorChange}
            placeholder="Generators"
            className="w-full"
          >
            {generators.map(generator => (
              <Select.Option
                key={generator.generatorName}
                value={generator.generatorName}
              >
                /{generator.generatorName}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="w-full h-full max-h-[calc(100%_-_48px)]">
        {activeGenerator && (
          <GeneratorForm
            generator={activeGenerator}
            presetCreation={presetCreation}
          />
        )}
      </div>
    </>
  )
}

export default CreationWorkspace
