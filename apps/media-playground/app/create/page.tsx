import GeneratorsGrid from '@/features/generators/generators-grid'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <GeneratorsGrid
        outputType={['image', 'video', 'audio']}
        showFeatured={true}
      />
    </div>
  )
}

export default CreatePage
