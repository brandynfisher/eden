'use client'

import LoadingIndicator from '@/components/loading-indicator'
import Timeline from '@/components/timeline/timeline'
import { Skeleton } from '@/components/ui/skeleton'
import GeneratorForm from '@/features/generators/generator-form'
import { useGeneratorQuery } from '@/hooks/query/use-generator-query'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  generatorKey: GeneratorV2['key']
  generatorSSRData?: GeneratorV2
}

const Workspace = ({ generatorKey, generatorSSRData }: Props) => {
  const { generator: generatorClientData } = useGeneratorQuery({
    key: generatorKey,
    initialData: generatorSSRData
      ? {
          generator: generatorSSRData,
        }
      : undefined,
  })

  const generator = generatorSSRData || generatorClientData

  if (!generator) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-3 2xl:grid-cols-3">
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <div className="overflow-y-auto md:pr-4 md:sticky md:top-16 md:max-h-[calc(100vh_-_106px)] md:pt-4">
          <GeneratorForm generator={generator} />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingIndicator />}>
        <Timeline generator={generator} />
      </Suspense>
    </div>
  )
}

export default Workspace
