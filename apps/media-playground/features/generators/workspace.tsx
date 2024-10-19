'use client'

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

  const generator = generatorClientData || generatorSSRData

  if (!generator) {
    return null
  }

  return (
    <div data-test-id="workspace" className="flex flex-col lg:flex-row">
      <div className="lg:pr-4 lg:sticky lg:top-[120px] lg:h-screen min-w-[324px] w-full lg:max-w-[420px] lg:pt-4">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <GeneratorForm generator={generator} />
        </Suspense>
      </div>

      <div className="mb-8 lg:pt-4 flex flex-col gap-y-4 w-full">
        <Suspense>
          <Timeline generator={generator} />
        </Suspense>
      </div>
    </div>
  )
}

export default Workspace
