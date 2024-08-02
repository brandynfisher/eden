'use client'

import 'react-photo-view/dist/react-photo-view.css'

import GeneratorForm from '@/components/form/generator-form'
import LoadingIndicator from '@/components/loading-indicator'
import Timeline from '@/components/timeline/timeline'
import { useGeneratorQuery } from '@/hooks/query/use-generator-query'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'
import { PhotoProvider } from 'react-photo-view'

type Props = {
  generatorKey: GeneratorV2['key']
}
const Workspace = ({ generatorKey }: Props) => {
  const { generator } = useGeneratorQuery({ key: generatorKey })

  if (!generator) {
    return null
  }

  return (
    <PhotoProvider>
      <div className="grid grid-cols-1 xl:gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <GeneratorForm generator={generator} />
        <Suspense fallback={<LoadingIndicator />}>
          <Timeline generator={generator} />
        </Suspense>
      </div>
    </PhotoProvider>
  )
}

export default Workspace
