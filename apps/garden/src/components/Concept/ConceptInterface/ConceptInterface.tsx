import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import TimelineList from '@/components/Creation/CreationInterface/Timeline/TimelineList'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { EdenContext } from '@/providers/EdenProvider'
import { Generator } from '@edenlabs/eden-sdk'
import React, { useContext, useEffect, useRef, useState } from 'react'

const availableConceptGenerators = ['sdxl-lora-trainer']

const ConceptInterface = () => {
  const timelineListRef = useRef<HTMLDivElement>(null)
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

  if (!generators || !activeGenerator) {
    return <LoadingIndicator />
  }

  return (
    <div className="w-full">
      <h2 className="mb-4">Concept Trainer</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
          {activeGenerator && <GeneratorForm generator={activeGenerator} />}
        </div>
        <TimelineList innerRef={timelineListRef} />
      </div>

      {CONFIG.DEV_TYPE === 'dummy' && <TestGeneratorInterface />}
    </div>
  )
}

export default ConceptInterface
