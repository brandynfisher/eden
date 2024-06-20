import WorkflowCard from '@/components/card/workflow-card'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { workflows } from '@/features/workflows/dummyConfig'

const CreatePage = () => {
  return (
    <div className="flex flex-col gap-4">
      <TypographyH3>Create</TypographyH3>

      <div>
        <TypographyH4 className="mb-4">Video</TypographyH4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {workflows.video.map(workflow => (
            <WorkflowCard
              key={workflow.title}
              title={workflow.title}
              image={workflow.image}
              link={workflow.link}
              description={workflow.description}
            />
          ))}
        </div>
      </div>

      <div>
        <TypographyH4 className="mb-4">Image</TypographyH4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {workflows.image.map(workflow => (
            <WorkflowCard
              key={workflow.title}
              title={workflow.title}
              image={workflow.image}
              link={workflow.link}
              description={workflow.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CreatePage
