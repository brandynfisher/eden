import ToolsGrid from '@/features/tools/tools-grid'

const TrainPage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <ToolsGrid output_type={['lora']} />
    </div>
  )
}

export default TrainPage
