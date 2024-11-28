import LoadingIndicator from '@/components/loading-indicator'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import ToolsGrid from '@/features/tools/tools-grid'
import { Suspense } from 'react'

const TrainPage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <TypographyH3>Train Models</TypographyH3>
      <Suspense fallback={<LoadingIndicator />}>
        <ToolsGrid output_type={['lora']} />
      </Suspense>
    </div>
  )
}

export default TrainPage
