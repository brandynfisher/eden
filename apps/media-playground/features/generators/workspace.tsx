'use client'

import Timeline from '@/components/timeline/timeline'
import { Skeleton } from '@/components/ui/skeleton'
import GeneratorForm from '@/features/generators/generator-form'
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
      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <div className="overflow-y-auto md:pr-4 md:sticky md:top-16 md:max-h-[calc(100vh_-_106px)] md:pt-4">
          <GeneratorForm generator={generator} />
        </div>
      </Suspense>
      <Timeline generator={generator} />
    </div>
  )
}

export default Workspace
