import LoadingIndicator from '@/components/loading-indicator'
import ToolsGrid from '@/features/tools/tools-grid'
import { Suspense } from 'react'

const TrainPage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <Suspense fallback={<LoadingIndicator />}>
        <ToolsGrid output_type={['lora']} />
      </Suspense>
    </div>
  )
}

export default TrainPage
