import LoadingIndicator from '@/components/loading-indicator'
import GeneratorsGrid from '@/features/generators/generators-grid'
import { Suspense } from 'react'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <Suspense fallback={<LoadingIndicator />}>
        <GeneratorsGrid outputType={['image', 'video', 'audio']} />
      </Suspense>
    </div>
  )
}

export default CreatePage
