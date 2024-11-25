import LoadingIndicator from '@/components/loading-indicator'
import Workspace from '@/features/generators/workspace'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  params: {
    generator: GeneratorV2['key']
    output_type: GeneratorV2['output_type']
  }
}

const TrainGeneratorPage = ({ params }: Props) => {
  const { generator } = params

  return (
    <div>
      <Suspense fallback={<LoadingIndicator className="p-4" />}>
        <Workspace generatorKey={generator} />
      </Suspense>
    </div>
  )
}

export default TrainGeneratorPage
