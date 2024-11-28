import ToolsGrid from '@/features/tools/tools-grid'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <ToolsGrid
        output_type={['image', 'video', 'audio']}
        showFeatured={true}
      />
    </div>
  )
}

export default CreatePage
