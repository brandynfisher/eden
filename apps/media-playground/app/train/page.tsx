import WorkflowCard from '@/components/card/workflow-card'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import workflowCoverDummyImage from '@/public/images/workflows/model-training-concept.jpeg'

const trainWorkflows = [
  {
    title: 'Model',
    link: '/train/model',
    image: workflowCoverDummyImage.src,
  },
  {
    title: 'Concept',
    link: '/train/concept',
    image: workflowCoverDummyImage.src,
  },
]

const TrainPage = () => {
  return (
    <div>
      <TypographyH3>Workflows: Train</TypographyH3>
      <div className="flex gap-4">
        {trainWorkflows.map(workflow => (
          <WorkflowCard
            key={workflow.title}
            title={workflow.title}
            image={workflow.image}
            link={workflow.link}
          />
        ))}
      </div>
    </div>
  )
}

export default TrainPage
