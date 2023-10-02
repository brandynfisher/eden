import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import ResultPreview from '@/components/Creation/CreationInterface/ResultPreview'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { EdenContext } from '@/providers/EdenProvider'
import { Generator } from '@edenlabs/eden-sdk'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const availableConceptGenerators = ['sdxl-lora-trainer']

const ConceptInterface = () => {
  const resultPreviewRef = useRef<HTMLDivElement>(null)
  const { generators } = useContext(EdenContext)
  const [availableGenerators, setAvailableGenerators] = useState<Generator[]>()
  const [activeGenerator, setActiveGenerator] = useState(
    availableGenerators?.[0] || undefined,
  )

  useEffect(() => {
    const available = generators?.filter(generator =>
      availableConceptGenerators.includes(generator.generatorName),
    )
    setAvailableGenerators(available)
    setActiveGenerator(available?.[0])
  }, [generators])

  const scrollResultPreviewIntoView = useCallback(() => {
    if (resultPreviewRef && resultPreviewRef.current) {
      resultPreviewRef.current.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }
  }, [resultPreviewRef])

  if (!generators || !activeGenerator) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full">
      <h2 className="mb-4">Concept Trainer</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
          {activeGenerator && (
            <GeneratorForm
              generator={activeGenerator}
              onSubmitSuccess={scrollResultPreviewIntoView}
            />
          )}
        </div>
        <ResultPreview innerRef={resultPreviewRef} />
      </div>

      {CONFIG.DEV_TYPE === 'dummy' && <TestGeneratorInterface />}
    </div>
  )
}

export default ConceptInterface
