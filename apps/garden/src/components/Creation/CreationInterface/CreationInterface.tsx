import CreationPresetInfo from '@/components/Creation/CreationInterface/CreationPresetInfo'
import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import ResultPreviewList from '@/components/Creation/CreationInterface/ResultPreviewList'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { EdenContext } from '@/providers/EdenProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { Select } from 'antd'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const hiddenCreationGenerators = [
  'complete',
  'tts',
  'tts_fast',
  'sdxl-lora-trainer',
  'interrogate',
  'monologue',
]

const usePosition = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const handleResize = () => {
      if (!ref?.current) return
      const { top, left } = ref.current.getBoundingClientRect()
      setPosition({ top, left })
    }

    handleResize()

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { ref, position }
}

const CreationInterface = ({
  generatorName,
  presetCreation,
}: {
  generatorName?: string
  presetCreation?: Creation
}) => {
  const resultPreviewRef = useRef<HTMLDivElement>(null)
  const { generators } = useContext(EdenContext)
  const { pendingTasks } = useContext(CreationNotificationContext)
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

  const { ref, position } = usePosition()

  if (!generators || !activeGenerator) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full">
      <h2 className="mb-4">Create</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
        <div className="lg:sticky lg:top-4 flex flex-col lg:max-h-screen">
          {presetCreation && <CreationPresetInfo creation={presetCreation} />}
          <label htmlFor="activeGenerator">Selected Generator:</label>
          <Select
            id="activeGenerator"
            value={activeGenerator?.generatorName}
            onChange={handleGeneratorChange}
            placeholder="Generators"
            className="mt-2 mb-4"
          >
            {generators
              .filter(
                generator =>
                  !hiddenCreationGenerators.includes(generator.generatorName),
              )
              .map(generator => (
                <Select.Option
                  key={generator.generatorName}
                  value={generator.generatorName}
                >
                  {generator.generatorName}
                </Select.Option>
              ))}
          </Select>
          <div
            className="lg:sticky lg:max-h-screen lg:overflow-auto"
            ref={ref}
            style={{
              maxHeight: `calc(100vh - ${position ? position.top : 0}px)`,
            }}
          >
            {activeGenerator && (
              <GeneratorForm
                generator={activeGenerator}
                presetCreation={presetCreation}
              />
            )}
            {pendingTasks?.length ? (
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4 gap-2">
                <div>
                  You can continue using the app, run multiple tasks or close
                  this tab.
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute">{pendingTasks?.length}</span>
                    <span className="loading loading-ring loading-lg"></span>
                  </div>
                  Tasks queued
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <ResultPreviewList innerRef={resultPreviewRef} />
      </div>

      {CONFIG.DEV_TYPE === 'dummy' && <TestGeneratorInterface />}
    </div>
  )
}

export default CreationInterface
