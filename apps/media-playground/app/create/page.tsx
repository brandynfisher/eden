// import { FeaturedAgents } from '@/features/agent/featured-agents'
import ToolsAccordion from '@/features/tools/tools-accordion'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4 pt-4">
      {/* <FeaturedAgents /> */}
      <ToolsAccordion
        output_type={['image', 'video', 'audio']}
        showFeatured={true}
      />
    </div>
  )
}

export default CreatePage
