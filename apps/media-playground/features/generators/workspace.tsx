'use client'

import GeneratorForm from '@/components/form/generator-form'
import LoadingIndicator from '@/components/loading-indicator'
import Timeline from '@/components/timeline/timeline'
import { useGeneratorsListQuery } from '@/hooks/query/use-generators-list-query'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  generatorKey: GeneratorV2['key']
}
const Workspace = ({ generatorKey }: Props) => {
  const { generators } = useGeneratorsListQuery()

  const generatorMetaData =
    generatorKey && generators
      ? generators.filter(generator => generator.key === generatorKey)[0]
      : undefined

  if (!generatorMetaData) {
    return null
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-8">
      <GeneratorForm generator={generatorMetaData} />
      <Suspense fallback={<LoadingIndicator />}>
        <Timeline generator={generatorMetaData} />
      </Suspense>
    </div>
  )
}

export default Workspace
