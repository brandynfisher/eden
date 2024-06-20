import TypographyH3 from '@/components/ui/typography/TypographyH3'

type Props = {
  params: {
    workflow: string
  }
}

const TrainWorkflowPage = ({ params }: Props) => {
  const { workflow } = params

  return (
    <div>
      <TypographyH3>train - {workflow}</TypographyH3>
      <div>training tools</div>
    </div>
  )
}

export default TrainWorkflowPage
