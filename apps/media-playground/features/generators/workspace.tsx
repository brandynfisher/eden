'use client'

import GeneratorForm from '@/components/form/generator-form'
import LoadingIndicator from '@/components/loading-indicator'
import Timeline from '@/components/timeline/timeline'
import { useGeneratorQuery } from '@/hooks/query/use-generator-query'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  generatorKey: GeneratorV2['key']
}
const Workspace = ({ generatorKey }: Props) => {
  const { generator } = useGeneratorQuery({ key: generatorKey })

  if (!generator) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-3 2xl:grid-cols-3">
      <GeneratorForm generator={generator} />
      <Suspense fallback={<LoadingIndicator />}>
        <Timeline generator={generator} />
      </Suspense>
    </div>
  )
}

export default Workspace
