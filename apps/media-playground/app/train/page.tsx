import ToolsAccordion from '@/features/tools/tools-accordion'

const TrainPage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      <ToolsAccordion output_type={['lora']} />
    </div>
  )
}

export default TrainPage
