import CreationWorkspace from '@/components/Creation/CreationInterface/CreationWorkspace'
import ResultPreviewList from '@/components/Creation/CreationInterface/ResultPreviewList'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { EdenContext } from '@/providers/EdenProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import { Tabs } from 'antd/lib'
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

const CreationInterface = ({
  generatorName,
  presetCreation,
}: {
  generatorName?: string
  presetCreation?: Creation
}) => {
  const { width } = useViewportSize()
  const resultPreviewRef = useRef<HTMLDivElement>(null)
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

  const isSmallScreen = width <= 1024

  return (
    <>
      {isSmallScreen ? (
        <Tabs
          className="creation-interface"
          defaultActiveKey="workspace"
          items={[
            {
              key: 'workspace',
              label: 'Workspace',
              className: 'h-full',
              children: (
                <div className="relative flex flex-col items-center overflow-hidden border rounded-lg border-solid border-gray-800 mb-4 h-full lg:max-h-[calc(100%_-_16px)]">
                  <CreationWorkspace
                    generators={generators.filter(
                      generator =>
                        !hiddenCreationGenerators.includes(
                          generator.generatorName,
                        ),
                    )}
                    presetCreation={presetCreation}
                    activeGenerator={activeGenerator}
                    handleGeneratorChange={handleGeneratorChange}
                  />
                </div>
              ),
            },
            {
              key: 'tasks',
              label: 'Tasks',
              children: (
                <div className="px-2 pt-2">
                  <ResultPreviewList innerRef={resultPreviewRef} />
                </div>
              ),
            },
          ]}
        />
      ) : (
        <div className="h-full lg:grid lg:grid-cols-2 lg:gap-2">
          <div className="relative flex flex-col items-center overflow-hidden border rounded-lg border-solid border-gray-800 mb-4 h-full lg:max-h-[calc(100%_-_16px)]">
            <CreationWorkspace
              generators={generators.filter(
                generator =>
                  !hiddenCreationGenerators.includes(generator.generatorName),
              )}
              presetCreation={presetCreation}
              activeGenerator={activeGenerator}
              handleGeneratorChange={handleGeneratorChange}
            />
          </div>

          <div className="overflow-y-auto px-2 pt-2">
            <ResultPreviewList innerRef={resultPreviewRef} />
          </div>

          {CONFIG.DEV_TYPE === 'dummy' ? <TestGeneratorInterface /> : null}
        </div>
      )}
    </>
  )
}

export default CreationInterface
