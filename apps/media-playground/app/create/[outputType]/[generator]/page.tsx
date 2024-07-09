import LoadingIndicator from '@/components/loading-indicator'
import Workspace from '@/features/generators/workspace'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  params: {
    generator: GeneratorV2['name']
    outputType: GeneratorV2['outputType']
  }
}

const GeneratorPage = ({ params }: Props) => {
  const { generator } = params

  return (
    <div>
      <Suspense fallback={<LoadingIndicator />}>
        <Workspace generatorName={generator} />
      </Suspense>
    </div>
  )
}

export default GeneratorPage
