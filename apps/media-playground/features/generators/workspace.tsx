'use client'

import GeneratorForm from '@/components/form/generator-form'
import LoadingIndicator from '@/components/loading-indicator'
import Timeline from '@/components/timeline/timeline'
import { useGeneratorsQuery } from '@/hooks/query/use-generator-query'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  generatorName: GeneratorV2['name']
}
const Workspace = ({ generatorName }: Props) => {
  const { generators } = useGeneratorsQuery()

  const generatorMetaData =
    generatorName && generators
      ? generators.filter(gen => gen.name === generatorName)[0]
      : undefined

  if (!generatorMetaData) {
    return null
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-8">
      <GeneratorForm generator={generatorMetaData} />
      <Suspense fallback={<LoadingIndicator />}>
        <Timeline workflow={generatorMetaData} />
      </Suspense>
    </div>
  )
}

export default Workspace
