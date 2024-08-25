import LoadingIndicator from '@/components/loading-indicator'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import GeneratorsGrid from '@/features/generators/generators-grid'
import { Suspense } from 'react'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <TypographyH3>Create</TypographyH3>
      <Suspense fallback={<LoadingIndicator />}>
        <GeneratorsGrid outputType={['image', 'video', 'audio']} />
      </Suspense>
    </div>
  )
}

export default CreatePage
