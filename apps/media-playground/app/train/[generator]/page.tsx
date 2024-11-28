import LoadingIndicator from '@/components/loading-indicator'
import Workspace from '@/features/tools/workspace'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  params: {
    generator: ToolV2['key']
    output_type: ToolV2['output_type']
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
