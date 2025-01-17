import LoadingIndicator from '@/components/loading-indicator'
import Workspace from '@/features/tools/workspace'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  params: {
    tool: ToolV2['key']
    output_type: ToolV2['output_type']
  }
}

const TrainToolPage = ({ params }: Props) => {
  const { tool } = params

  return (
    <div>
      <Suspense fallback={<LoadingIndicator className="p-4" />}>
        <Workspace toolKey={tool} />
      </Suspense>
    </div>
  )
}

export default TrainToolPage
